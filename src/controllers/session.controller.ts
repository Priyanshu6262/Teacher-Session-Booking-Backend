import { Request, Response, NextFunction } from 'express';
import {
  createSessionService,
  getAvailableSessionsService,
  bookSessionService,
  completeSessionService,
} from '../services/session.service.js';

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacherId, startTime, endTime } = req.body;
    const session = await createSessionService({ teacherId, startTime, endTime });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dateTimestamp = Number(req.query.dateTimestamp);
    const sessions = await getAvailableSessionsService(dateTimestamp);

    res.status(200).json({
      success: true,
      message: 'Available sessions retrieved successfully',
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const bookSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { userId } = req.body;
    const session = await bookSessionService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Session booked successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

export const completeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const session = await completeSessionService(id);

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
