import { Router, Request, Response, NextFunction } from 'express';
import { codeLimiter } from '../middleware/rateLimit.middleware.js';
import { upload, validateUploadedFiles } from '../middleware/upload.middleware.js';
import {
  studentService,
  validateCodeSchema,
  studentInfoSchema,
  destinationSchema,
} from '../services/student.service.js';

const router = Router();

// POST /api/student/validate-code - Validate access code
router.post('/validate-code', codeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = validateCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid code format',
      });
      return;
    }

    const result = await studentService.validateCode(parsed.data.code);

    if (!result.valid) {
      res.status(result.reason === 'not_found' ? 404 : 403).json({
        success: false,
        error: 'Invalid or expired access code',
        reason: result.reason,
        professorEmail: result.professorEmail,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        status: result.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/student/:code - Get request form by code
router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const result = await studentService.getRequestByCode(code);

    if (!result.success) {
      const statusCode = result.reason === 'not_found' ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: 'Request not found or no longer accepting submissions',
        reason: result.reason,
        professorEmail: result.professorEmail,
      });
      return;
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/student/:code - Update student information
router.put('/:code', async (req: Request, res: Response, next: NextFunction) => {
  const code = req.params.code as string;
  try {
    const parsed = studentInfoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const request = await studentService.updateStudentInfo(code, parsed.data);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message === 'Request cannot be modified') {
        // Get details about why it can't be modified
        const result = await studentService.validateCode(code);
        res.status(403).json({
          success: false,
          error: error.message,
          reason: result.reason,
          professorEmail: result.professorEmail,
        });
        return;
      }
    }
    next(error);
  }
});

// POST /api/student/:code/documents - Upload documents
router.post(
  '/:code/documents',
  upload.array('files', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const files = req.files as Express.Multer.File[];
      const { label, description } = req.body;

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded',
        });
        return;
      }

      // Validate file contents
      const { valid, invalid } = await validateUploadedFiles(files);

      if (invalid.length > 0 && valid.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type',
          invalidFiles: invalid,
        });
        return;
      }

      // Save valid documents to database
      const documents = [];
      for (const file of valid) {
        const doc = await studentService.addDocument(code, file, label, description);
        documents.push(doc);
      }

      res.json({
        success: true,
        data: {
          uploaded: documents,
          rejected: invalid.length > 0 ? invalid : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Request not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/student/:code/documents/:documentId - Delete a document
router.delete('/:code/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const documentId = req.params.documentId as string;
    await studentService.deleteDocument(code, documentId);

    res.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request not found' || error.message === 'Document not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
    }
    next(error);
  }
});

// POST /api/student/:code/destinations - Add submission destination
router.post('/:code/destinations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const parsed = destinationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const destination = await studentService.addDestination(code, parsed.data);

    res.json({
      success: true,
      data: destination,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Request not found') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/student/:code/destinations/:destinationId - Update a destination
router.put('/:code/destinations/:destinationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const destinationId = req.params.destinationId as string;
    const parsed = destinationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const destination = await studentService.updateDestination(code, destinationId, parsed.data);

    res.json({
      success: true,
      data: destination,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request not found' || error.message === 'Destination not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message === 'Request cannot be modified') {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
    }
    next(error);
  }
});

// DELETE /api/student/:code/destinations/:destinationId - Delete a destination
router.delete('/:code/destinations/:destinationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const destinationId = req.params.destinationId as string;
    await studentService.deleteDestination(code, destinationId);

    res.json({
      success: true,
      message: 'Destination deleted',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request not found' || error.message === 'Destination not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
    }
    next(error);
  }
});

// POST /api/student/:code/submit - Final submission
router.post('/:code/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const request = await studentService.submitRequest(code);

    res.json({
      success: true,
      data: request,
      message: 'Request submitted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (
        error.message === 'Student name and email are required' ||
        error.message === 'At least one submission destination is required'
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
    }
    next(error);
  }
});

export default router;
