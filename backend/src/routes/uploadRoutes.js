import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Extension comes from the verified MIME type, never from the uploaded file
// name. (Using the original name let a file like "x.html" be saved and served
// from our domain.)
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

// Checks the first bytes of the file really are an image of that type
function looksLikeImage(buf, mime) {
  if (!buf || buf.length < 12) return false;
  const hex = buf.subarray(0, 12).toString('hex');
  switch (mime) {
    case 'image/jpeg': return hex.startsWith('ffd8ff');
    case 'image/png': return hex.startsWith('89504e47');
    case 'image/gif': return hex.startsWith('47494638');
    case 'image/webp': return hex.startsWith('52494646') && buf.subarray(8, 12).toString() === 'WEBP';
    case 'image/avif': return buf.subarray(4, 12).toString().startsWith('ftypavi');
    default: return false;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (MIME_EXT[file.mimetype]) cb(null, true);
    else cb(Object.assign(new Error('Only JPEG, PNG, WebP, GIF or AVIF images are allowed'), { statusCode: 400 }));
  },
});

// Cloudinary is used when CLOUDINARY_URL is set (recommended in production:
// Render/Railway wipe local files on every deploy). Otherwise files are saved to
// ./uploads and served at /uploads.
const useCloudinary = () => Boolean(process.env.CLOUDINARY_URL);

function saveLocally(file, folder) {
  const dir = path.join(process.cwd(), 'uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${MIME_EXT[file.mimetype]}`;
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return `/uploads/${folder}/${name}`;
}

function saveToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `coolrunnings/${folder}`, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });
}

async function handleUpload(req, res, folder) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  if (!looksLikeImage(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ success: false, message: "That file isn't a valid image" });
  }
  const url = useCloudinary() ? await saveToCloudinary(req.file, folder) : saveLocally(req.file, folder);
  res.json({ success: true, data: { url } });
}

// POST /api/upload/blog-image  (admin)
router.post('/blog-image', protect, adminOnly, upload.single('image'), async (req, res, next) => {
  try { await handleUpload(req, res, 'blog'); } catch (err) { next(err); }
});

// POST /api/upload/avatar  (any signed-in user)
router.post('/avatar', protect, upload.single('image'), async (req, res, next) => {
  try { await handleUpload(req, res, 'avatars'); } catch (err) { next(err); }
});

// Multer errors (file too large, wrong type)
router.use((err, _req, res, _next) => {
  const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message || 'Upload failed';
  res.status(400).json({ success: false, message });
});

export default router;
