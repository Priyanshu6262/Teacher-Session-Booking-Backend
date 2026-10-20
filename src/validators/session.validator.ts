import { z } from 'zod';
import { objectIdSchema } from './user.validator.js';

export const createSessionSchema = z.object({
  body: z
    .object({
      teacherId: objectIdSchema,
      startTime: z
        .string()
        .datetime({ message: 'Start time must be a valid ISO 8601 date string' }),
      endTime: z
        .string()
        .datetime({ message: 'End time must be a valid ISO 8601 date string' }),
    })
    .refine(
      (data) => {
        const start = new Date(data.startTime).getTime();
        const end = new Date(data.endTime).getTime();
        return end > start;
      },
      {
        message: 'End time must be greater than start time',
        path: ['endTime'],
      }
    ),
});

export const availableSessionsQuerySchema = z.object({
  query: z.object({
    dateTimestamp: z
      .string()
      .min(1, 'dateTimestamp query parameter is required')
      .refine(
        (val) => {
          const num = Number(val);
          return !isNaN(num) && Number.isInteger(num) && num > 0 && !isNaN(new Date(num).getTime());
        },
        {
          message: 'dateTimestamp must be a valid positive integer Unix timestamp in milliseconds',
        }
      ),
  }),
});

export const bookSessionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    userId: objectIdSchema,
  }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
