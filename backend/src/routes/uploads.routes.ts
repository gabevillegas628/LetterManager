import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/uploads/documents/:id - View document (inline)
router.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (!fs.existsSync(document.path)) {
      res.status(404).json({ success: false, error: 'File not found on disk' });
      return;
    }

    // Set content type for inline viewing
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);

    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/uploads/documents/:id/download - Download document (attachment)
router.get('/documents/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (!fs.existsSync(document.path)) {
      res.status(404).json({ success: false, error: 'File not found on disk' });
      return;
    }

    // Set headers for download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.size.toString());

    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/uploads/documents/:id/info - Get document metadata (protected)
router.get('/documents/:id/info', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        request: {
          select: {
            id: true,
            accessCode: true,
            studentName: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        label: document.label,
        description: document.description,
        createdAt: document.createdAt,
        request: document.request,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/uploads/documents/:id - Delete document (protected)
router.delete('/documents/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    // Delete file from disk
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    res.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
