import type { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { ApiError } from '../utils/api-error';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;

    next();
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};