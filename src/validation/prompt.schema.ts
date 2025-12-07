import { z } from 'zod';
import mongoose from 'mongoose';
import { sanitizeInput } from '../utils/sanitize.util.js';

const trimAndSanitize = (input: unknown) =>
  typeof input === 'string' ? sanitizeInput(input.trim()) : input;

const objectIdSchema = z.string().refine(
  (val) => {
    return mongoose.Types.ObjectId.isValid(val);
  },
  { message: 'Invalid ID format.' },
);

export const createPromptSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .max(200, 'Title cannot exceed 200 characters.')
    .transform(trimAndSanitize),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters.')
    .transform(trimAndSanitize)
    .optional(),
  promptText: z
    .string()
    .min(10, 'Prompt text must be at least 10 characters.')
    .transform(trimAndSanitize),
  sampleOutput: z.string().min(1, 'Sample output is required.').optional(),
  mediaType: z.enum(['text', 'image', 'video', 'audio']),
  aiModel: z
    .string()
    .min(1, 'AI model is required.')
    .max(100, 'AI model name cannot exceed 100 characters.')
    .transform(trimAndSanitize),
  tags: z
    .array(z.string().transform(trimAndSanitize))
    .max(10, 'Cannot have more than 10 tags.')
    .optional()
    .default([]),
  isPublic: z.boolean().optional().default(true),
});

export const updatePromptSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .max(200, 'Title cannot exceed 200 characters.')
    .transform(trimAndSanitize)
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters.')
    .transform(trimAndSanitize)
    .optional(),
  promptText: z
    .string()
    .min(10, 'Prompt text must be at least 10 characters.')
    .transform(trimAndSanitize)
    .optional(),
  sampleOutput: z.string().min(1, 'Sample output is required.').optional(),
  mediaType: z.enum(['text', 'image', 'video', 'audio']).optional(),
  aiModel: z
    .string()
    .min(1, 'AI model is required.')
    .max(100, 'AI model name cannot exceed 100 characters.')
    .transform(trimAndSanitize)
    .optional(),
  tags: z
    .array(z.string().transform(trimAndSanitize))
    .max(10, 'Cannot have more than 10 tags.')
    .optional(),
  isPublic: z.boolean().optional(),
});

export const feedQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer.')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer.')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default(20),
  tag: z.string().transform(trimAndSanitize).optional(),
  aiModel: z.string().transform(trimAndSanitize).optional(),
  search: z.string().transform(trimAndSanitize).optional(),
});

export const getPromptSchema = z.object({
  id: objectIdSchema,
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
export type FeedQueryParams = z.infer<typeof feedQuerySchema>;
export type GetPromptParams = z.infer<typeof getPromptSchema>;
