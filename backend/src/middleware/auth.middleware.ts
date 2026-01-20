import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../db/index.js';
import { AppError } from './error.middleware.js';

export interface AuthRequest extends Request {
  professorId?: string;
}

interface JwtPayload {
  professorId: string;
  iat: number;
  exp: number;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Verify professor still exists
    const professor = await prisma.professor.findUnique({
      where: { id: decoded.professorId },
    });

    if (!professor) {
      throw new AppError('Professor not found', 401);
    }

    req.professorId = decoded.professorId;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
}
