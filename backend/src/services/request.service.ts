import { RequestStatus } from '@prisma/client';
import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { createAccessCode } from './code.service.js';

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

export async function listRequests(options?: ListRequestsOptions) {
  const where: {
    status?: RequestStatus;
    OR?: Array<{
      studentName?: { contains: string; mode: 'insensitive' };
      studentEmail?: { contains: string; mode: 'insensitive' };
      accessCode?: { contains: string; mode: 'insensitive' };
    }>;
  } = {};

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
        _count: {
          select: {
            documents: true,
            destinations: true,
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

export async function getRequest(id: string) {
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

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  return request;
}

export async function createRequest(data: CreateRequestInput) {
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

  const request = await prisma.letterRequest.create({
    data: {
      accessCode,
      deadline: data.deadline,
      professorNotes: data.professorNotes,
    },
  });

  return request;
}

export async function updateRequest(id: string, data: UpdateRequestInput) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing) {
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

export async function deleteRequest(id: string) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Request not found', 404);
  }

  // This will cascade delete documents, destinations, and letters
  await prisma.letterRequest.delete({
    where: { id },
  });

  return { message: 'Request deleted' };
}

export async function updateRequestStatus(id: string, status: RequestStatus) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Request not found', 404);
  }

  const request = await prisma.letterRequest.update({
    where: { id },
    data: { status },
  });

  return request;
}

export async function regenerateAccessCode(id: string) {
  const existing = await prisma.letterRequest.findUnique({
    where: { id },
  });

  if (!existing) {
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

export async function getRequestStats() {
  const [total, pending, submitted, inProgress, completed] = await Promise.all([
    prisma.letterRequest.count(),
    prisma.letterRequest.count({ where: { status: 'PENDING' } }),
    prisma.letterRequest.count({ where: { status: 'SUBMITTED' } }),
    prisma.letterRequest.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.letterRequest.count({ where: { status: 'COMPLETED' } }),
  ]);

  const upcomingDeadlines = await prisma.letterRequest.findMany({
    where: {
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
