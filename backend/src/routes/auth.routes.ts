import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import { config } from '../config/index.js';

// Image upload configuration for professor images
const imageDir = path.join(config.uploadDir, 'professor-images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${nanoid(16)}${ext}`);
  },
});

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, GIF, WebP, and SVG images are allowed'));
  }
};

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for images
  },
});

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const setupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  department: z.string().optional(),
  institution: z.string().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  institution: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  headerConfig: z.object({
    showName: z.boolean(),
    items: z.array(z.string()),
  }).nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// GET /api/auth/needs-setup - Check if setup is needed
router.get('/needs-setup', async (req, res, next) => {
  try {
    const needsSetup = await authService.needsSetup();
    res.json({ success: true, data: { needsSetup } });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - Professor login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// POST /api/auth/setup - Initial setup (first-time only)
router.post('/setup', authLimiter, async (req, res, next) => {
  try {
    const data = setupSchema.parse(req.body);
    const result = await authService.setup(data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user profile
router.get(
  '/me',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const professor = await authService.getProfile(req.professorId!);
      res.json({ success: true, data: professor });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/profile - Update profile
router.put(
  '/profile',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const professor = await authService.updateProfile(req.professorId!, data);
      res.json({ success: true, data: professor });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/password - Change password
router.put(
  '/password',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      const result = await authService.changePassword(
        req.professorId!,
        data.currentPassword,
        data.newPassword
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/letterhead - Upload letterhead image
router.post(
  '/letterhead',
  authMiddleware,
  imageUpload.single('letterhead'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const professor = await authService.updateLetterheadImage(
        req.professorId!,
        req.file.path
      );
      res.json({ success: true, data: professor });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// DELETE /api/auth/letterhead - Delete letterhead image
router.delete(
  '/letterhead',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const professor = await authService.deleteLetterheadImage(req.professorId!);
      res.json({ success: true, data: professor });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/signature - Upload signature image
router.post(
  '/signature',
  authMiddleware,
  imageUpload.single('signature'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const professor = await authService.updateSignatureImage(
        req.professorId!,
        req.file.path
      );
      res.json({ success: true, data: professor });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// DELETE /api/auth/signature - Delete signature image
router.delete(
  '/signature',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const professor = await authService.deleteSignatureImage(req.professorId!);
      res.json({ success: true, data: professor });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/images/:type - Serve professor images (protected for now)
router.get(
  '/images/:type',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      const imagePath = await authService.getImagePath(req.professorId!, type as 'letterhead' | 'signature');

      if (!imagePath || !fs.existsSync(imagePath)) {
        res.status(404).json({ success: false, error: 'Image not found' });
        return;
      }

      const ext = path.extname(imagePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      fs.createReadStream(imagePath).pipe(res);
    } catch (error) {
      next(error);
    }
  }
);

// ============ Question Management Routes ============

// GET /api/auth/questions - Get professor's custom questions
router.get(
  '/questions',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const questions = await authService.getQuestions(req.professorId!);
      res.json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/questions - Update professor's custom questions
router.put(
  '/questions',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const questions = req.body;
      if (!Array.isArray(questions)) {
        res.status(400).json({ success: false, error: 'Questions must be an array' });
        return;
      }
      const updated = await authService.updateQuestions(req.professorId!, questions);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ============ Admin Routes ============

// Validation schema for creating a professor
const createProfessorSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  department: z.string().optional(),
  institution: z.string().optional(),
});

// GET /api/auth/professors - List all professors (admin only)
router.get(
  '/professors',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const professors = await authService.listProfessors(req.professorId!);
      res.json({ success: true, data: professors });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/professors - Create a new professor (admin only)
router.post(
  '/professors',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createProfessorSchema.parse(req.body);
      const professor = await authService.createProfessor(req.professorId!, data);
      res.status(201).json({ success: true, data: professor });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/professors/:id - Delete a professor (admin only)
router.delete(
  '/professors/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await authService.deleteProfessor(req.professorId!, id as string);
      res.json({ success: true, message: 'Professor deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
