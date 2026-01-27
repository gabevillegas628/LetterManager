import { Prisma, RequestStatus } from '@prisma/client';
import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { createAccessCode } from './code.service.js';
import { CustomQuestion, DEFAULT_QUESTIONS } from 'shared';

export interface CreateRequestInput {
  deadline?: Date;
  professorNotes?: string;
}

export interface UpdateRequestInput {
  deadline?: Date;
  professorNotes?: string;
  status?: RequestStatus;
}

export interface ListRequestsOptions {
  status?: RequestStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listRequests(professorId: string, options?: ListRequestsOptions) {
  const where: {
    professorId: string;
    status?: RequestStatus;
    OR?: Array<{
      studentName?: { contains: string; mode: 'insensitive' };
      studentEmail?: { contains: string; mode: 'insensitive' };
      accessCode?: { contains: string; mode: 'insensitive' };
    }>;
  } = { professorId };

  if (options?.status) {
    where.status = options.status;
  }

  if (options?.search) {
    where.OR = [
      { studentName: { contains: options.search, mode: 'insensitive' } },
      { studentEmail: { contains: options.search, mode: 'insensitive' } },
      { accessCode: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.letterRequest.findMany({
      where,
      include: {
        destinations: {
          select: {
            id: true,
            institutionName: true,
            deadline: true,
          },
          orderBy: { deadline: 'asc' },
        },
        _count: {
          select: {
            documents: true,
            letters: true,
          },
        },
      },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.letterRequest.count({ where }),
  ]);

  return { requests, total };
}

export async function getRequest(professorId: string, id: string) {
  const request = await prisma.letterRequest.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      destinations: {
        orderBy: { createdAt: 'asc' },
      },
      letters: {
        orderBy: { version: 'desc' },
        include: {
          template: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  return request;
}

export async function createRequest(professorId: string, data: CreateRequestInput) {
  // Generate unique access code
  let accessCode = createAccessCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const existing = await prisma.letterRequest.findUnique({
      where: { accessCode },
    });

    if (!existing) break;

    accessCode = createAccessCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new AppError('Failed to generate unique access code', 500);
  }

  // Get professor's custom questions (or use defaults)
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    select: { customQuestions: true },
  });

  const questions = (professor?.customQuestions as CustomQuestion[] | null) ?? DEFAULT_QUESTIONS;

  const request = await prisma.letterRequest.create({
    data: {
      professorId,
      accessCode,
      deadline: data.deadline,
      professorNotes: data.professorNotes,
      questions: questions as unknown as Prisma.InputJsonValue, // Copy questions snapshot to request
    },
  });

  return request;
}

export async function updateRequest(professorId: string, id: string, data: UpdateRequestInput) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing || existing.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const request = await prisma.letterRequest.update({
    where: { id },
    data: {
      ...(data.deadline !== undefined && { deadline: data.deadline }),
      ...(data.professorNotes !== undefined && { professorNotes: data.professorNotes }),
      ...(data.status && { status: data.status }),
    },
  });

  return request;
}

export async function deleteRequest(professorId: string, id: string) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing || existing.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  // This will cascade delete documents, destinations, and letters
  await prisma.letterRequest.delete({
    where: { id },
  });

  return { message: 'Request deleted' };
}

export async function updateRequestStatus(professorId: string, id: string, status: RequestStatus) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing || existing.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const request = await prisma.letterRequest.update({
    where: { id },
    data: { status },
  });

  return request;
}

export async function regenerateAccessCode(professorId: string, id: string) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing || existing.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  // Generate new unique code
  let accessCode = createAccessCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existingCode = await prisma.letterRequest.findUnique({
      where: { accessCode },
    });

    if (!existingCode) break;

    accessCode = createAccessCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new AppError('Failed to generate unique access code', 500);
  }

  const request = await prisma.letterRequest.update({
    where: { id },
    data: {
      accessCode,
      codeGeneratedAt: new Date(),
    },
  });

  return request;
}

export async function getRequestStats(professorId: string) {
  const [total, pending, submitted, inProgress, completed] = await Promise.all([
    prisma.letterRequest.count({ where: { professorId } }),
    prisma.letterRequest.count({ where: { professorId, status: 'PENDING' } }),
    prisma.letterRequest.count({ where: { professorId, status: 'SUBMITTED' } }),
    prisma.letterRequest.count({ where: { professorId, status: 'IN_PROGRESS' } }),
    prisma.letterRequest.count({ where: { professorId, status: 'COMPLETED' } }),
  ]);

  const upcomingDeadlines = await prisma.letterRequest.findMany({
    where: {
      professorId,
      deadline: {
        gte: new Date(),
        lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 14 days
      },
      status: {
        not: 'COMPLETED',
      },
    },
    orderBy: { deadline: 'asc' },
    take: 5,
  });

  return {
    total,
    pending,
    submitted,
    inProgress,
    completed,
    upcomingDeadlines,
  };
}
