import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  errors?: Record<string, string[]>,
  statusCode = 400
) {
  const body: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(body);
}
