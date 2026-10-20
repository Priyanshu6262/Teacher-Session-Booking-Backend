import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { Session } from '../models/Session.js';
import { AppError } from '../utils/AppError.js';

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
}

export interface UserSessionHistoryResult {
  upcomingSessions: any[];
  completedSessions: any[];
}

export const createUserService = async (input: CreateUserInput): Promise<IUser> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('A user with this email address already exists', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const user = await User.create({
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    phone: input.phone.trim(),
  });

  return user;
};

export const getUserSessionsService = async (userId: string): Promise<UserSessionHistoryResult> => {
  // Confirm user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Mandatory: Implement this endpoint using MongoDB aggregation.
  // Use suitable $match, $lookup, $unwind, $facet, $sort, and $project stages.
  const [result] = await Session.aggregate([
    {
      $match: {
        userId: userObjectId,
        status: { $in: ['BOOKED', 'COMPLETED'] },
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        upcomingSessions: [
          {
            $match: {
              status: 'BOOKED',
              startTime: { $gte: now },
            },
          },
          {
            $sort: {
              startTime: 1, // Sort upcoming sessions by startTime ascending
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
        ],
        completedSessions: [
          {
            $match: {
              status: 'COMPLETED',
            },
          },
          {
            $sort: {
              completedAt: -1, // Sort completed sessions by completedAt descending
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
        ],
      },
    },
  ]);

  return {
    upcomingSessions: result?.upcomingSessions || [],
    completedSessions: result?.completedSessions || [],
  };
};
