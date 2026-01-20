import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { Request } from 'express';
import { config } from '../config/index.js';

// Allowed file types with their magic bytes
const ALLOWED_TYPES: Record<string, { mimes: string[]; magicBytes: number[][] }> = {
  pdf: {
    mimes: ['application/pdf'],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  doc: {
    mimes: ['application/msword'],
    magicBytes: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]], // MS Office
  },
  docx: {
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    magicBytes: [[0x50, 0x4b, 0x03, 0x04]], // ZIP (Office Open XML)
  },
  png: {
    mimes: ['image/png'],
    magicBytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  jpg: {
    mimes: ['image/jpeg'],
    magicBytes: [[0xff, 0xd8, 0xff]],
  },
  gif: {
    mimes: ['image/gif'],
    magicBytes: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
  },
};

// Flatten allowed mimes
const ALLOWED_MIMES = Object.values(ALLOWED_TYPES).flatMap((t) => t.mimes);

// Ensure upload directory exists
const uploadDir = config.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectory for request if code is available
    const codeParam = (req as Request).params.code;
    const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
    const destDir = code ? path.join(uploadDir, code) : uploadDir;

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${nanoid(16)}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 10, // Max 10 files per request
  },
});

// Validate file content using magic bytes
export async function validateFileContent(filePath: string): Promise<boolean> {
  const { fileTypeFromFile } = await import('file-type');

  try {
    const type = await fileTypeFromFile(filePath);

    if (!type) {
      // Could be a text file or unknown type
      return false;
    }

    // Check if the detected MIME is in our allowed list
    return ALLOWED_MIMES.includes(type.mime);
  } catch {
    return false;
  }
}

// Middleware to validate uploaded files after upload
export async function validateUploadedFiles(
  files: Express.Multer.File[]
): Promise<{ valid: Express.Multer.File[]; invalid: string[] }> {
  const valid: Express.Multer.File[] = [];
  const invalid: string[] = [];

  for (const file of files) {
    const isValid = await validateFileContent(file.path);

    if (isValid) {
      valid.push(file);
    } else {
      // Delete invalid file
      try {
        fs.unlinkSync(file.path);
      } catch {
        // Ignore deletion errors
      }
      invalid.push(file.originalname);
    }
  }

  return { valid, invalid };
}

// Delete file helper
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore deletion errors
  }
}
