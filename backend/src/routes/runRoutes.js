import express from 'express';
import { body } from 'express-validator';
import { getRuns, getRun, createRun, updateRun, deleteRun, getRunStats } from '../controllers/runController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const WEATHER = ['sunny', 'cloudy', 'rainy', 'hot', 'cold', 'windy', ''];

// `optional` makes every rule optional for edits (PUT) but required for create (POST)
const runRules = (optional = false) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('distance').isFloat({ min: 0.1, max: 500 }).withMessage('Distance must be between 0.1 and 500 km').toFloat(),
    f('duration').isInt({ min: 1, max: 7 * 24 * 3600 }).withMessage('Enter a valid duration').toInt(),
    f('startTime').isISO8601().withMessage('Enter a valid date and time')
      .custom((v) => new Date(v).getTime() <= Date.now() + 24 * 3600 * 1000).withMessage('Run date cannot be in the future'),
    body('endTime').optional().isISO8601().withMessage('Enter a valid end time'),
    body('weather').optional().isIn(WEATHER).withMessage('Invalid weather value'),
    body('rating').optional({ values: 'null' }).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    body('shoes').optional().isString().isLength({ max: 100 }).withMessage('Shoes cannot exceed 100 characters'),
    body('elevationGain').optional().isFloat({ min: 0, max: 10000 }).withMessage('Invalid elevation gain').toFloat(),
    body('calories').optional().isFloat({ min: 0, max: 20000 }).withMessage('Invalid calories').toFloat(),
  ];
};

router.use(protect);

router.get('/', getRuns);
router.get('/stats', getRunStats);
router.get('/:id', getRun);
router.post('/', runRules(false), validate, createRun);
router.put('/:id', runRules(true), validate, updateRun);
router.delete('/:id', deleteRun);

export default router;
