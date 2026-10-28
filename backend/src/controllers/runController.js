import mongoose from 'mongoose';
import Run from '../models/Run.js';
import { asyncHandler } from '../middleware/error.js';
import { recalcUserStats } from '../utils/userData.js';

// Only these fields can be set by the client. userId, pace and timestamps are
// always decided by the server (previously the whole body was saved as-is, so a
// user could move a run onto someone else's account by sending a userId).
const EDITABLE = ['distance', 'duration', 'calories', 'weather', 'shoes', 'notes', 'rating', 'elevationGain', 'startTime', 'endTime'];

function pick(body) {
  const out = {};
  for (const k of EDITABLE) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

const paceOf = (distance, duration) => (distance > 0 ? duration / 60 / distance : 0);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route GET /api/runs
// Filters: weather, minDistance, maxDistance, from, to (dates), q (search notes)
export const getRuns = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const query = { userId: req.user._id };

  if (req.query.weather) query.weather = String(req.query.weather);
  if (req.query.minDistance || req.query.maxDistance) {
    query.distance = {};
    if (req.query.minDistance) query.distance.$gte = Number(req.query.minDistance);
    if (req.query.maxDistance) query.distance.$lte = Number(req.query.maxDistance);
  }
  if (req.query.from || req.query.to) {
    query.startTime = {};
    if (req.query.from) query.startTime.$gte = new Date(req.query.from);
    if (req.query.to) query.startTime.$lte = new Date(req.query.to);
  }
  if (req.query.q) query.notes = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), 'i');

  const [items, total] = await Promise.all([
    // Newest *run* first (by when it happened, not when it was logged)
    Run.find(query).sort({ startTime: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Run.countDocuments(query),
  ]);

  res.json({ success: true, data: { items, page, pages: Math.max(Math.ceil(total / limit), 1), total } });
});

// @route GET /api/runs/:id
export const getRun = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Run not found' });
  const run = await Run.findOne({ _id: req.params.id, userId: req.user._id });
  if (!run) return res.status(404).json({ success: false, message: 'Run not found' });
  res.json({ success: true, data: run });
});

// @route POST /api/runs
export const createRun = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  data.userId = req.user._id;
  data.pace = paceOf(data.distance, data.duration);
  if (!data.endTime && data.startTime) data.endTime = new Date(new Date(data.startTime).getTime() + data.duration * 1000);

  const run = await Run.create(data);
  await recalcUserStats(req.user._id);
  res.status(201).json({ success: true, data: run });
});

// @route PUT /api/runs/:id
export const updateRun = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Run not found' });
  const run = await Run.findOne({ _id: req.params.id, userId: req.user._id });
  if (!run) return res.status(404).json({ success: false, message: 'Run not found' });

  Object.assign(run, pick(req.body));
  run.pace = paceOf(run.distance, run.duration);
  if (req.body.startTime && !req.body.endTime) {
    run.endTime = new Date(new Date(run.startTime).getTime() + run.duration * 1000);
  }
  await run.save();
  await recalcUserStats(req.user._id);
  res.json({ success: true, data: run });
});

// @route DELETE /api/runs/:id
export const deleteRun = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Run not found' });
  const run = await Run.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!run) return res.status(404).json({ success: false, message: 'Run not found' });
  await recalcUserStats(req.user._id);
  res.json({ success: true, message: 'Run deleted successfully' });
});

// @route GET /api/runs/stats
export const getRunStats = asyncHandler(async (req, res) => {
  const [s] = await Run.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: null,
        totalRuns: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        totalDuration: { $sum: '$duration' },
        averageDistance: { $avg: '$distance' },
        longestRun: { $max: '$distance' },
      },
    },
  ]);
  const r = s || { totalRuns: 0, totalDistance: 0, totalDuration: 0, averageDistance: 0, longestRun: 0 };
  delete r._id;
  // Distance-weighted average pace (min/km)
  r.averagePace = r.totalDistance > 0 ? r.totalDuration / 60 / r.totalDistance : 0;
  res.json({ success: true, data: r });
});
