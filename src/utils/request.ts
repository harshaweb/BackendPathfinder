import type { Request } from 'express';
import { ApiError } from './api-error';

export const requireUser = (req: Request): { uid: string; email: string } => {
  const user = req.user;
  if (!user?.uid || !user.email) {
    throw new ApiError(401, 'Unauthorized request');
  }

  return {
    uid: user.uid,
    email: user.email,
  };
};

export const getString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
  return value.trim();
};
