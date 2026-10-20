import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // Handle Invalid JSON payload in body
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Malformed JSON in request body';
  }

  // Handle Mongoose / MongoDB CastError (e.g. invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid format for ${err.path}: '${err.value}'`;
  }

  // Handle Mongoose Validation Error
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(', ');
  }

  // Handle MongoDB Duplicate Key Error (E11000)
  else if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    statusCode = 409;
    const mongoErr = err as MongoError;
    const field = mongoErr.keyValue ? Object.keys(mongoErr.keyValue)[0] : 'field';
    const value = mongoErr.keyValue ? mongoErr.keyValue[field] : '';
    errorCode = field === 'email' ? 'EMAIL_ALREADY_EXISTS' : 'DUPLICATE_KEY_ERROR';
    message = `Duplicate value '${value}' for field '${field}'. Resource already exists.`;
  }

  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  }

  // Generic unhandled error
  else {
    if (env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred. Please try again later.';
      errorCode = 'INTERNAL_SERVER_ERROR';
    } else {
      console.error('Unhandled Server Error:', err);
    }
  }

  const responseBody: Record<string, any> = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  // Include error details or stack trace only in non-production environments when available
  if (env.NODE_ENV !== 'production' && err.details) {
    responseBody.error.details = err.details;
  }

  res.status(statusCode).json(responseBody);
};
