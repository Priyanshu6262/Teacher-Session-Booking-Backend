import { z } from 'zod';
import mongoose from 'mongoose';

export const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

export const createUserSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name cannot be empty'),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .toLowerCase(),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number cannot be empty'),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
