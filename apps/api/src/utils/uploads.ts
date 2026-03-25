import fs from 'fs';
import path from 'path';

const configuredUploadDir = process.env.UPLOAD_DIR?.trim() || './uploads';

export const uploadDir = path.resolve(configuredUploadDir);

let uploadDirEnsured = false;

export function ensureUploadDirExists(): string {
  if (!uploadDirEnsured) {
    fs.mkdirSync(uploadDir, { recursive: true });
    uploadDirEnsured = true;
  }

  return uploadDir;
}
