import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';

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

export default router;
