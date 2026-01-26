import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { config } from '../config/index.js';
import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';

const BCRYPT_ROUNDS = 12;

export interface ProfessorResponse {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  title: string | null;
  department: string | null;
  institution: string | null;
  address: string | null;
  phone: string | null;
  hasLetterhead: boolean;
  hasSignature: boolean;
  headerConfig: { showName: boolean; items: string[] } | null;
  createdAt: Date;
  updatedAt: Date;
}

function excludePassword(professor: {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  title: string | null;
  department: string | null;
  institution: string | null;
  address: string | null;
  phone: string | null;
  signature: string | null;
  letterheadImage: string | null;
  signatureImage: string | null;
  headerConfig: unknown;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}): ProfessorResponse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, signature, letterheadImage, signatureImage, ...rest } = professor;
  return {
    ...rest,
    headerConfig: rest.headerConfig as { showName: boolean; items: string[] } | null,
    hasLetterhead: !!letterheadImage,
    hasSignature: !!signatureImage,
  };
}

export function generateToken(professorId: string): string {
  return jwt.sign({ professorId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  } as jwt.SignOptions);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function login(email: string, password: string) {
  const professor = await prisma.professor.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!professor) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValidPassword = await verifyPassword(password, professor.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(professor.id);

  return {
    token,
    professor: excludePassword(professor),
  };
}

export async function setup(data: {
  email: string;
  password: string;
  name: string;
  title?: string;
  department?: string;
  institution?: string;
}) {
  // Check if any professor already exists
  const existingCount = await prisma.professor.count();

  if (existingCount > 0) {
    throw new AppError('Setup already completed', 400);
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const passwordHash = await hashPassword(data.password);

  const professor = await prisma.professor.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      isAdmin: true, // First professor is always admin
      title: data.title,
      department: data.department,
      institution: data.institution,
    },
  });

  const token = generateToken(professor.id);

  return {
    token,
    professor: excludePassword(professor),
  };
}

export async function getProfile(professorId: string) {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  return excludePassword(professor);
}

export async function updateProfile(
  professorId: string,
  data: {
    name?: string;
    title?: string;
    department?: string;
    institution?: string;
    address?: string;
    phone?: string;
    headerConfig?: { showName: boolean; items: string[] } | null;
  }
) {
  // Convert null headerConfig to undefined so Prisma doesn't try to update it
  const { headerConfig, ...rest } = data;
  const updateData = {
    ...rest,
    ...(headerConfig !== null && headerConfig !== undefined ? { headerConfig } : {}),
  };

  const professor = await prisma.professor.update({
    where: { id: professorId },
    data: updateData,
  });

  return excludePassword(professor);
}

export async function changePassword(
  professorId: string,
  currentPassword: string,
  newPassword: string
) {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  const isValidPassword = await verifyPassword(
    currentPassword,
    professor.passwordHash
  );

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.professor.update({
    where: { id: professorId },
    data: { passwordHash },
  });

  return { message: 'Password updated successfully' };
}

export async function needsSetup(): Promise<boolean> {
  const count = await prisma.professor.count();
  return count === 0;
}

export async function updateLetterheadImage(
  professorId: string,
  imagePath: string
): Promise<ProfessorResponse> {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  // Delete old letterhead if exists
  if (professor.letterheadImage && fs.existsSync(professor.letterheadImage)) {
    try {
      fs.unlinkSync(professor.letterheadImage);
    } catch {
      // Ignore deletion errors
    }
  }

  const updated = await prisma.professor.update({
    where: { id: professorId },
    data: { letterheadImage: imagePath },
  });

  return excludePassword(updated);
}

export async function deleteLetterheadImage(
  professorId: string
): Promise<ProfessorResponse> {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  // Delete file if exists
  if (professor.letterheadImage && fs.existsSync(professor.letterheadImage)) {
    try {
      fs.unlinkSync(professor.letterheadImage);
    } catch {
      // Ignore deletion errors
    }
  }

  const updated = await prisma.professor.update({
    where: { id: professorId },
    data: { letterheadImage: null },
  });

  return excludePassword(updated);
}

export async function updateSignatureImage(
  professorId: string,
  imagePath: string
): Promise<ProfessorResponse> {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  // Delete old signature if exists
  if (professor.signatureImage && fs.existsSync(professor.signatureImage)) {
    try {
      fs.unlinkSync(professor.signatureImage);
    } catch {
      // Ignore deletion errors
    }
  }

  const updated = await prisma.professor.update({
    where: { id: professorId },
    data: { signatureImage: imagePath },
  });

  return excludePassword(updated);
}

export async function deleteSignatureImage(
  professorId: string
): Promise<ProfessorResponse> {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  // Delete file if exists
  if (professor.signatureImage && fs.existsSync(professor.signatureImage)) {
    try {
      fs.unlinkSync(professor.signatureImage);
    } catch {
      // Ignore deletion errors
    }
  }

  const updated = await prisma.professor.update({
    where: { id: professorId },
    data: { signatureImage: null },
  });

  return excludePassword(updated);
}

export async function getImagePath(
  professorId: string,
  type: 'letterhead' | 'signature'
): Promise<string | null> {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  return type === 'letterhead' ? professor.letterheadImage : professor.signatureImage;
}

// Admin functions

export async function isAdmin(professorId: string): Promise<boolean> {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    select: { isAdmin: true },
  });
  return professor?.isAdmin ?? false;
}

export async function verifyAdmin(professorId: string): Promise<void> {
  const admin = await isAdmin(professorId);
  if (!admin) {
    throw new AppError('Admin access required', 403);
  }
}

export async function listProfessors(adminId: string): Promise<ProfessorResponse[]> {
  await verifyAdmin(adminId);

  const professors = await prisma.professor.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return professors.map(excludePassword);
}

export async function createProfessor(
  adminId: string,
  data: {
    email: string;
    password: string;
    name: string;
    title?: string;
    department?: string;
    institution?: string;
  }
): Promise<ProfessorResponse> {
  await verifyAdmin(adminId);

  // Check if email already exists
  const existing = await prisma.professor.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const passwordHash = await hashPassword(data.password);

  const professor = await prisma.professor.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      isAdmin: false, // New professors are not admins
      title: data.title,
      department: data.department,
      institution: data.institution,
    },
  });

  return excludePassword(professor);
}

export async function deleteProfessor(
  adminId: string,
  professorId: string
): Promise<void> {
  await verifyAdmin(adminId);

  // Cannot delete yourself
  if (adminId === professorId) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    include: {
      letterRequests: {
        include: {
          documents: { select: { path: true } },
          letters: { select: { pdfPath: true } },
        },
      },
    },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  // Helper to safely delete a file
  const safeUnlink = (filePath: string | null) => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore deletion errors
      }
    }
  };

  // Delete all associated files before cascade delete
  // 1. Delete student-uploaded documents
  for (const request of professor.letterRequests) {
    for (const doc of request.documents) {
      safeUnlink(doc.path);
    }
    // 2. Delete letter PDFs
    for (const letter of request.letters) {
      safeUnlink(letter.pdfPath);
    }
  }

  // 3. Delete professor's letterhead and signature images
  safeUnlink(professor.letterheadImage);
  safeUnlink(professor.signatureImage);

  // Delete professor (cascades to requests, templates, etc.)
  await prisma.professor.delete({
    where: { id: professorId },
  });
}
