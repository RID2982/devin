import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf'];
const ALLOWED_MIME_EXACT = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
];

function entitySubfolder(req: import('express').Request): string {
  if (req.body.eventId) return path.join('events', String(req.body.eventId));
  if (req.body.taskId) return path.join('tasks', String(req.body.taskId));
  return 'misc';
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.resolve(env.UPLOAD_DIR, entitySubfolder(req));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      ALLOWED_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p)) ||
      ALLOWED_MIME_EXACT.includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});
