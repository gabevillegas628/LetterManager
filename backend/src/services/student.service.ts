import { prisma } from '../db/index.js';
import { Prisma, RequestStatus, SubmissionMethod, SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import { deleteFile } from '../middleware/upload.middleware.js';

// Validation schemas
export const validateCodeSchema = z.object({
  code: z.string().min(6).max(12),
});

export const studentInfoSchema = z.object({
  studentName: z.string().min(1, 'Name is required'),
  studentEmail: z.string().email('Invalid email'),
  studentPhone: z.string().optional(),
  programApplying: z.string().optional(),
  institutionApplying: z.string().optional(),
  degreeType: z.string().optional(),
  courseTaken: z.string().optional(),
  grade: z.string().optional(),
  semesterYear: z.string().optional(),
  relationshipDescription: z.string().optional(),
  achievements: z.string().optional(),
  personalStatement: z.string().optional(),
  additionalNotes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

export const destinationSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  programName: z.string().optional(),
  recipientName: z.string().optional(),
  recipientEmail: z.string().email().optional().or(z.literal('')),
  portalUrl: z.string().url().optional().or(z.literal('')),
  portalInstructions: z.string().optional(),
  method: z.nativeEnum(SubmissionMethod),
  deadline: z.string().optional(),
});

export const studentService = {
  // Validate access code
  async validateCode(code: string): Promise<{
    valid: boolean;
    status?: RequestStatus;
    reason?: 'not_found' | 'in_progress' | 'completed' | 'archived';
    professorEmail?: string;
  }> {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
      select: {
        status: true,
        professor: { select: { email: true } },
      },
    });

    if (!request) {
      return { valid: false, reason: 'not_found' };
    }

    // Only allow access if PENDING or SUBMITTED (for editing)
    const allowedStatuses: RequestStatus[] = ['PENDING', 'SUBMITTED'];
    if (!allowedStatuses.includes(request.status)) {
      const reason = request.status === 'IN_PROGRESS' ? 'in_progress'
        : request.status === 'COMPLETED' ? 'completed'
        : 'archived';

      return { valid: false, status: request.status, reason, professorEmail: request.professor.email };
    }

    return { valid: true, status: request.status };
  },

  // Get request by code (for student form)
  async getRequestByCode(code: string): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    reason?: 'not_found' | 'in_progress' | 'completed' | 'archived';
    professorEmail?: string;
  }> {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
      include: {
        professor: {
          select: { email: true },
        },
        documents: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            label: true,
            description: true,
            createdAt: true,
          },
        },
        destinations: {
          select: {
            id: true,
            institutionName: true,
            programName: true,
            recipientName: true,
            recipientEmail: true,
            portalUrl: true,
            portalInstructions: true,
            method: true,
            deadline: true,
          },
        },
      },
    });

    if (!request) {
      return { success: false, reason: 'not_found' };
    }

    // Only return if status allows student access
    const allowedStatuses: RequestStatus[] = ['PENDING', 'SUBMITTED'];
    if (!allowedStatuses.includes(request.status)) {
      const reason = request.status === 'IN_PROGRESS' ? 'in_progress'
        : request.status === 'COMPLETED' ? 'completed'
        : 'archived';

      return { success: false, reason, professorEmail: request.professor.email };
    }

    // Return student-visible fields only
    return {
      success: true,
      data: {
        id: request.id,
        accessCode: request.accessCode,
        status: request.status,
        studentName: request.studentName,
        studentEmail: request.studentEmail,
        studentPhone: request.studentPhone,
        programApplying: request.programApplying,
        institutionApplying: request.institutionApplying,
        degreeType: request.degreeType,
        courseTaken: request.courseTaken,
        grade: request.grade,
        semesterYear: request.semesterYear,
        relationshipDescription: request.relationshipDescription,
        achievements: request.achievements,
        personalStatement: request.personalStatement,
        additionalNotes: request.additionalNotes,
        customFields: request.customFields,
        questions: request.questions, // Custom questions for dynamic form rendering
        deadline: request.deadline,
        documents: request.documents,
        destinations: request.destinations,
      },
    };
  },

  // Update student information
  async updateStudentInfo(code: string, data: z.infer<typeof studentInfoSchema>) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const allowedStatuses: RequestStatus[] = ['PENDING', 'SUBMITTED'];
    if (!allowedStatuses.includes(request.status)) {
      throw new Error('Request cannot be modified');
    }

    return prisma.letterRequest.update({
      where: { accessCode: code.toUpperCase() },
      data: {
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        studentPhone: data.studentPhone || null,
        programApplying: data.programApplying || null,
        institutionApplying: data.institutionApplying || null,
        degreeType: data.degreeType || null,
        courseTaken: data.courseTaken || null,
        grade: data.grade || null,
        semesterYear: data.semesterYear || null,
        relationshipDescription: data.relationshipDescription || null,
        achievements: data.achievements || null,
        personalStatement: data.personalStatement || null,
        additionalNotes: data.additionalNotes || null,
        customFields: data.customFields ?? Prisma.JsonNull,
      },
    });
  },

  // Add document
  async addDocument(
    code: string,
    file: { originalname: string; filename: string; mimetype: string; size: number; path: string },
    label?: string,
    description?: string
  ) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    return prisma.document.create({
      data: {
        requestId: request.id,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        label: label || null,
        description: description || null,
      },
    });
  },

  // Delete document
  async deleteDocument(code: string, documentId: string) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        requestId: request.id,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from disk
    deleteFile(document.path);

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return true;
  },

  // Add submission destination
  async addDestination(code: string, data: z.infer<typeof destinationSchema>) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const destination = await prisma.submissionDestination.create({
      data: {
        requestId: request.id,
        institutionName: data.institutionName,
        programName: data.programName || null,
        recipientName: data.recipientName || null,
        recipientEmail: data.recipientEmail || null,
        portalUrl: data.portalUrl || null,
        portalInstructions: data.portalInstructions || null,
        method: data.method,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: 'PENDING' as SubmissionStatus,
      },
    });

    // Auto-submit if request is PENDING and has all required info
    // This handles the case where a student adds destinations after initially
    // trying to submit without any
    if (request.status === 'PENDING' && request.studentName && request.studentEmail) {
      await prisma.letterRequest.update({
        where: { id: request.id },
        data: {
          status: 'SUBMITTED',
          studentSubmittedAt: new Date(),
        },
      });
    }

    return destination;
  },

  // Delete destination
  async deleteDestination(code: string, destinationId: string) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const destination = await prisma.submissionDestination.findFirst({
      where: {
        id: destinationId,
        requestId: request.id,
      },
    });

    if (!destination) {
      throw new Error('Destination not found');
    }

    await prisma.submissionDestination.delete({
      where: { id: destinationId },
    });

    return true;
  },

  // Update destination
  async updateDestination(code: string, destinationId: string, data: z.infer<typeof destinationSchema>) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const allowedStatuses: RequestStatus[] = ['PENDING', 'SUBMITTED'];
    if (!allowedStatuses.includes(request.status)) {
      throw new Error('Request cannot be modified');
    }

    const destination = await prisma.submissionDestination.findFirst({
      where: {
        id: destinationId,
        requestId: request.id,
      },
    });

    if (!destination) {
      throw new Error('Destination not found');
    }

    return prisma.submissionDestination.update({
      where: { id: destinationId },
      data: {
        institutionName: data.institutionName,
        programName: data.programName || null,
        recipientName: data.recipientName || null,
        recipientEmail: data.recipientEmail || null,
        portalUrl: data.portalUrl || null,
        portalInstructions: data.portalInstructions || null,
        method: data.method,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });
  },

  // Final submission
  async submitRequest(code: string) {
    const request = await prisma.letterRequest.findUnique({
      where: { accessCode: code.toUpperCase() },
      include: {
        destinations: true,
      },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    // Validate required fields
    if (!request.studentName || !request.studentEmail) {
      throw new Error('Student name and email are required');
    }

    if (request.destinations.length === 0) {
      throw new Error('At least one submission destination is required');
    }

    // Update status to SUBMITTED
    return prisma.letterRequest.update({
      where: { accessCode: code.toUpperCase() },
      data: {
        status: 'SUBMITTED',
        studentSubmittedAt: new Date(),
      },
    });
  },
};
