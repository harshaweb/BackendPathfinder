import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'Route not found'));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
