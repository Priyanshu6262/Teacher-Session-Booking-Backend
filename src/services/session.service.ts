import mongoose from 'mongoose';
import { Session, ISession } from '../models/Session.js';
import { Teacher } from '../models/Teacher.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export interface CreateSessionInput {
  teacherId: string;
  startTime: string;
  endTime: string;
}

export const createSessionService = async (input: CreateSessionInput): Promise<ISession> => {
  // Confirm teacher exists
  const teacher = await Teacher.findById(input.teacherId);
  if (!teacher) {
    throw new AppError('Teacher not found', 404, 'TEACHER_NOT_FOUND');
  }

  const startDate = new Date(input.startTime);
  const endDate = new Date(input.endTime);

  if (endDate.getTime() <= startDate.getTime()) {
    throw new AppError('End time must be greater than start time', 400, 'INVALID_TIME_RANGE');
  }

  const session = await Session.create({
    teacherId: new mongoose.Types.ObjectId(input.teacherId),
    userId: null,
    startTime: startDate,
    endTime: endDate,
    status: 'AVAILABLE',
    completedAt: null,
  });

  return session;
};

export const getAvailableSessionsService = async (dateTimestamp: number): Promise<any[]> => {
  // Calculate beginning and end of that calendar day in UTC
  const targetDate = new Date(dateTimestamp);
  const startOfDay = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const endOfDay = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

  // Mandatory: Use MongoDB aggregation pipeline ($match, $lookup, $unwind, $project)
  const sessions = await Session.aggregate([
    {
      $match: {
        status: 'AVAILABLE',
        startTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    {
      $unwind: {
        path: '$teacher',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $sort: {
        startTime: 1,
      },
    },
    {
      $project: {
        _id: 1,
        teacherId: 1,
        userId: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        completedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        teacher: {
          _id: '$teacher._id',
          fullName: '$teacher.fullName',
          email: '$teacher.email',
          specialization: '$teacher.specialization',
          experience: '$teacher.experience',
        },
      },
    },
  ]);

  return sessions;
};

export const bookSessionService = async (sessionId: string, userId: string): Promise<ISession> => {
  // Confirm user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Atomically update session if and only if status is AVAILABLE
  const bookedSession = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      status: 'AVAILABLE',
    },
    {
      $set: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'BOOKED',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  // If update failed, determine the specific reason
  if (!bookedSession) {
    const existingSession = await Session.findById(sessionId);
    if (!existingSession) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    throw new AppError(
      `Session is already ${existingSession.status.toLowerCase()} and cannot be booked`,
      409,
      'SESSION_ALREADY_BOOKED'
    );
  }

  return bookedSession;
};

export const completeSessionService = async (sessionId: string): Promise<ISession> => {
  // Atomically update status to COMPLETED and set completedAt to current server time
  const now = new Date();
  const completedSession = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      status: 'BOOKED',
    },
    {
      $set: {
        status: 'COMPLETED',
        completedAt: now,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  // If update failed, diagnose why
  if (!completedSession) {
    const existingSession = await Session.findById(sessionId);
    if (!existingSession) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (existingSession.status === 'COMPLETED') {
      throw new AppError('Session is already completed', 409, 'SESSION_ALREADY_COMPLETED');
    }

    throw new AppError(
      `Cannot complete session with status '${existingSession.status}'. Only BOOKED sessions can be completed.`,
      409,
      'INVALID_SESSION_STATUS'
    );
  }

  return completedSession;
};
