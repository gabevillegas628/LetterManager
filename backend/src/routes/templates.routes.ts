import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import * as templateService from '../services/template.service.js';
import { generatePreviewPdf } from '../services/pdf.service.js';
import { prisma } from '../db/index.js';
import type { CustomQuestion } from 'shared';

const router = Router();

// All template routes require authentication
router.use(authMiddleware);

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  content: z.string().min(1, 'Content is required'),
  variables: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional(),
        category: z.string().optional(),
      })
    )
    .optional(),
  category: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET /api/templates/variables/list - Get available variables (system + custom questions)
router.get('/variables/list', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get professor's custom questions to include their variables
    const professor = await prisma.professor.findUnique({
      where: { id: req.professorId },
      select: { customQuestions: true },
    });

    const customQuestions = (professor?.customQuestions as CustomQuestion[] | null) || [];

    // Map custom questions to template variables
    const questionVariables = customQuestions.map((q) => ({
      name: q.variableName,
      description: q.label,
      category: 'Student Questions',
    }));

    res.json({
      success: true,
      data: [...templateService.SYSTEM_VARIABLES, ...questionVariables],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/templates/preview-pdf - Generate PDF preview from template content (must be before /:id)
router.post('/preview-pdf', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    // Replace variables with sample data
    const sampleVariables = templateService.getSampleVariables();
    const interpolatedContent = templateService.interpolateTemplate(content, sampleVariables);

    // Generate PDF buffer with professor's letterhead
    const pdfBuffer = await generatePreviewPdf(req.professorId!, interpolatedContent);

    // Send as PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/templates - List all templates
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const category = req.query.category as string | undefined;

    const templates = await templateService.listTemplates(req.professorId!, {
      activeOnly,
      category,
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
});

// GET /api/templates/:id - Get single template
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const template = await templateService.getTemplate(req.professorId!, id);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// POST /api/templates - Create new template
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createTemplateSchema.parse(req.body);
    const template = await templateService.createTemplate(req.professorId!, data);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = updateTemplateSchema.parse(req.body);
    const template = await templateService.updateTemplate(req.professorId!, id, data);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await templateService.deleteTemplate(req.professorId!, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const template = await templateService.duplicateTemplate(req.professorId!, id);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// POST /api/templates/:id/preview - Preview with sample data (HTML)
router.post('/:id/preview', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const template = await templateService.getTemplate(req.professorId!, id);
    const customVariables = req.body.variables || {};
    const sampleVariables = templateService.getSampleVariables();

    // Merge custom variables with sample variables
    const variables = { ...sampleVariables, ...customVariables };

    const preview = templateService.interpolateTemplate(template.content, variables);

    res.json({
      success: true,
      data: {
        preview,
        variables,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
