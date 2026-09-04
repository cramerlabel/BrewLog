import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../env.js';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Creates a multer instance scoped to `uploads/<subdir>`, always writing randomized filenames
// (never the client-supplied name) so paths served back to users can't traverse the filesystem.
export function createImageUpload(subdir: string) {
  const destDir = path.join(env.UPLOADS_DIR, subdir);
  fs.mkdirSync(destDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destDir),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME_TYPES[file.mimetype];
      cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES[file.mimetype]) {
        cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
        return;
      }
      cb(null, true);
    },
  }).single('photo');
}

export function resolveUploadPath(relativePath: string): string {
  return path.resolve(env.UPLOADS_DIR, relativePath);
}

export function deleteUploadedFile(relativePath: string | null | undefined): void {
  if (!relativePath) return;
  fs.rm(resolveUploadPath(relativePath), { force: true }, () => {});
}
