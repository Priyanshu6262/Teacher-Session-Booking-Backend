import { Request, Response, NextFunction } from 'express';
import { createUserService, getUserSessionsService } from '../services/user.service.js';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, phone } = req.body;
    const user = await createUserService({ fullName, email, phone });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const sessions = await getUserSessionsService(id);

    res.status(200).json({
      success: true,
      message: 'User session history retrieved successfully',
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};
