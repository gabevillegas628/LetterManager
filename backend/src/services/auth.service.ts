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
  title: string | null;
  department: string | null;
  institution: string | null;
  hasLetterhead: boolean;
  hasSignature: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function excludePassword(professor: {
  id: string;
  email: string;
  name: string;
  title: string | null;
  department: string | null;
  institution: string | null;
  signature: string | null;
  letterheadImage: string | null;
  signatureImage: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}): ProfessorResponse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, signature, letterheadImage, signatureImage, ...rest } = professor;
  return {
    ...rest,
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
  }
) {
  const professor = await prisma.professor.update({
    where: { id: professorId },
    data,
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
