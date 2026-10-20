import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign sanitized/transformed values back to request safely
      if (parsed.body) req.body = parsed.body;
      if (parsed.query && req.query) Object.assign(req.query, parsed.query);
      if (parsed.params && req.params) Object.assign(req.params, parsed.params);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.') || 'field'}: ${firstIssue.message}`
          : 'Validation failed';

        next(new AppError(errorMessage, 400, 'VALIDATION_ERROR', error.issues));
      } else {
        next(error);
      }
    }
  };
