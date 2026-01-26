import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import * as letterService from '../services/letter.service.js';
import * as pdfService from '../services/pdf.service.js';
import * as emailService from '../services/email.service.js';

const router = Router();

// All letter routes require authentication
router.use(authMiddleware);

// Validation schemas
const generateLetterSchema = z.object({
  requestId: z.string().uuid(),
  templateId: z.string().uuid(),
});

const updateLetterSchema = z.object({
  content: z.string().min(1),
});

const sendLetterSchema = z.object({
  destinationId: z.string().uuid(),
});

// POST /api/letters/generate - Generate letter from template (master only)
router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = generateLetterSchema.parse(req.body);
    const letter = await letterService.generateLetter(req.professorId!, data);
    res.status(201).json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/generate-all - Generate letters for all destinations
router.post('/generate-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = generateLetterSchema.parse(req.body);
    const result = await letterService.generateLettersForAllDestinations(req.professorId!, data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/request/:requestId - Get letters for a request
router.get('/request/:requestId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const letters = await letterService.getLettersForRequest(req.professorId!, requestId);
    res.json({ success: true, data: letters });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/request/:requestId/with-destinations - Get letters organized by destination
router.get('/request/:requestId/with-destinations', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const result = await letterService.getLettersWithDestinations(req.professorId!, requestId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/request/:requestId/master - Get master letter for request
router.get('/request/:requestId/master', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const letter = await letterService.getMasterLetter(req.professorId!, requestId);
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/request/:requestId/destination/:destinationId - Get letter for specific destination
router.get('/request/:requestId/destination/:destinationId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const destinationId = req.params.destinationId as string;
    const letter = await letterService.getLetterForDestination(req.professorId!, requestId, destinationId);
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/request/:requestId/sync - Sync master letter to all destinations
router.post('/request/:requestId/sync', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const letters = await letterService.syncMasterToDestinations(req.professorId!, requestId);
    res.json({ success: true, data: letters });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/letters/request/:requestId/all - Delete all letters for a request
router.delete('/request/:requestId/all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestId = req.params.requestId as string;
    const result = await letterService.deleteAllLettersForRequest(req.professorId!, requestId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/:id - Get letter details
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const letter = await letterService.getLetter(req.professorId!, id);
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// PUT /api/letters/:id - Update letter content
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = updateLetterSchema.parse(req.body);
    const letter = await letterService.updateLetter(req.professorId!, id, data);
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/letters/:id - Delete letter
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await letterService.deleteLetter(req.professorId!, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/:id/finalize - Finalize letter
router.post('/:id/finalize', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const letter = await letterService.finalizeLetter(req.professorId!, id);
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/:id/unfinalize - Unfinalize letter (allow editing)
router.post('/:id/unfinalize', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const letter = await letterService.unfinalizeLetter(req.professorId!, id);
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/:id/pdf - Generate PDF
router.post('/:id/pdf', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const pdfPath = await pdfService.generatePdf(id);
    res.json({
      success: true,
      data: {
        path: pdfPath,
        message: 'PDF generated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/:id/pdf - Download PDF
router.get('/:id/pdf', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const pdfPath = await pdfService.getPdfPath(id);

    // Get letter for filename
    const letter = await letterService.getLetter(req.professorId!, id);
    const studentName = letter.request?.studentName?.replace(/\s+/g, '_') || 'Student';
    const filename = `Recommendation_Letter_${studentName}.pdf`;

    res.download(pdfPath, filename);
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/:id/pdf/status - Check if PDF is up to date
router.get('/:id/pdf/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const isUpToDate = await pdfService.isPdfUpToDate(id);
    res.json({
      success: true,
      data: { isUpToDate },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/:id/send - Send letter via email
router.post('/:id/send', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { destinationId } = sendLetterSchema.parse(req.body);

    await emailService.sendLetter({
      letterId: id,
      destinationId,
    });

    res.json({
      success: true,
      message: 'Letter sent successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/destination/:id/mark-sent - Mark destination as manually sent
router.post('/destination/:id/mark-sent', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await emailService.markDestinationSent(id);
    res.json({ success: true, message: 'Destination marked as sent' });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/destination/:id/confirm - Mark destination as confirmed
router.post('/destination/:id/confirm', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await emailService.markDestinationConfirmed(id);
    res.json({ success: true, message: 'Destination marked as confirmed' });
  } catch (error) {
    next(error);
  }
});

// POST /api/letters/destination/:id/reset - Reset destination status
router.post('/destination/:id/reset', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await emailService.resetDestinationStatus(id);
    res.json({ success: true, message: 'Destination status reset' });
  } catch (error) {
    next(error);
  }
});

// GET /api/letters/email/status - Check email configuration status
router.get('/email/status', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isConfigured = await emailService.verifyEmailConfig();
    res.json({
      success: true,
      data: { isConfigured },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
