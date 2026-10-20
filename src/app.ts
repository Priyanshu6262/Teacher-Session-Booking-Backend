import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import sessionRoutes from './routes/session.routes.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors());

  // Body parsers with sensible size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Teacher Session Booking API is healthy',
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // API Routes
  app.use('/users', userRoutes);
  app.use('/sessions', sessionRoutes);

  // 404 handler for unknown routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
