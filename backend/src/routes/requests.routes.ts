import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RequestStatus } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import * as requestService from '../services/request.service.js';

const router = Router();

// All request routes require authentication
router.use(authMiddleware);

// Validation schemas
const createRequestSchema = z.object({
  deadline: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  professorNotes: z.string().max(5000).optional(),
});

const updateRequestSchema = z.object({
  deadline: z.string().datetime().optional().nullable().transform(val => val ? new Date(val) : undefined),
  professorNotes: z.string().max(5000).optional(),
  status: z.nativeEnum(RequestStatus).optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
});

// GET /api/requests/stats - Get request statistics
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await requestService.getRequestStats(req.professorId!);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/requests - List all requests
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as RequestStatus | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const result = await requestService.listRequests(req.professorId!, {
      status,
      search,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result.requests,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/requests/:id - Get single request
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const request = await requestService.getRequest(req.professorId!, id);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// POST /api/requests - Create new request (generates code)
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createRequestSchema.parse(req.body);
    const request = await requestService.createRequest(req.professorId!, data);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// PUT /api/requests/:id - Update request
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = updateRequestSchema.parse(req.body);
    const request = await requestService.updateRequest(req.professorId!, id, data);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/requests/:id - Delete request
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await requestService.deleteRequest(req.professorId!, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/requests/:id/status - Update status
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);
    const request = await requestService.updateRequestStatus(req.professorId!, id, status);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// POST /api/requests/:id/regenerate-code - Generate new access code
router.post('/:id/regenerate-code', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const request = await requestService.regenerateAccessCode(req.professorId!, id);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

export default router;
