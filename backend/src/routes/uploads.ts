import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

// Deliverable uploads only. Files that could be served as executable/active
// content on the API origin (.html/.svg/.js/.xml/.wasm/…), or that are obviously
// malicious (scripts, executables), are rejected so uploaded proof files can
// never become a stored-XSS / drive-by-download vector.
const HARD_BLOCKED_EXT = /\.(html?|svg|js|mjs|cjs|xml|wasm|xslt|sh|bat|cmd|exe|dll|msi|bin|ps1|vbs|jar|apk|dmg|pkg|py|php|rb|pl|asp|jsp)$/i;

const allowed = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'application/json', 'application/zip',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown', 'text/tab-separated-values',
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'video/mp4', 'video/webm', 'video/quicktime',
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '';
    if (!allowed.has((file.mimetype || '').toLowerCase()) || HARD_BLOCKED_EXT.test(ext)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});

// POST /api/uploads
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File is too large. Maximum size is 25MB.', undefined, 400);
      }
      if (err?.message === 'File type not allowed') {
        return sendError(
          res,
          'File type not allowed. Allowed types: images (png/jpeg/gif/webp), PDF, JSON, plain text/CSV/Markdown, ZIP, Office documents, and common audio/video formats.',
          undefined,
          400
        );
      }
      return sendError(res, err?.message || 'File upload failed', undefined, 400);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', undefined, 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return sendSuccess(
      res,
      'File uploaded successfully',
      {
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      201
    );
  });
});

export default router;