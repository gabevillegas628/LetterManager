import rateLimit from 'express-rate-limit';

// General API rate limit (effectively disabled - set high to avoid breaking changes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Effectively unlimited
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 min
  message: { success: false, error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Student code validation limit
export const codeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: { success: false, error: 'Too many code attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limit
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: { success: false, error: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
