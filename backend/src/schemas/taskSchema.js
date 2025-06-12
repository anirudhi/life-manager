import { z } from 'zod';

// Input schema for transcription processing
export const TranscriptionInputSchema = z.object({
  transcription: z.string().min(1, 'Transcription cannot be empty').max(5000, 'Transcription too long'),
  metadata: z.object({
    timestamp: z.string().datetime().optional(),
    source: z.enum(['voice', 'text', 'other']).optional(),
    userId: z.string().optional()
  }).optional()
});

// Duration schema
export const DurationSchema = z.object({
  value: z.number().positive('Duration must be positive'),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks']),
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
});

// Priority levels
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Task category
export const CategorySchema = z.enum([
  'work',
  'personal',
  'health',
  'learning',
  'creative',
  'social',
  'maintenance',
  'other'
]);

// Structured task output schema
export const StructuredTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(1000).optional(),
  category: CategorySchema,
  priority: PrioritySchema,
  estimatedDuration: DurationSchema,
  optimalOutcome: z.object({
    description: z.string().min(1, 'Optimal outcome description required').max(500),
    successCriteria: z.array(z.string().max(200)).min(1, 'At least one success criterion required'),
    impact: z.enum(['low', 'medium', 'high']),
    confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
  }),
  suggestedDeadline: z.string().datetime().optional(),
  prerequisites: z.array(z.string().max(200)).optional(),
  tags: z.array(z.string().max(50)).optional(),
  originalTranscription: z.string(),
  processedAt: z.string().datetime(),
  llmModel: z.string(),
  processingConfidence: z.number().min(0).max(1)
});

// Database task schema (what gets saved to PocketBase)
export const DatabaseTaskSchema = StructuredTaskSchema.extend({
  id: z.string().optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  userId: z.string().optional()
});

// API response schema
export const TaskProcessingResponseSchema = z.object({
  success: z.boolean(),
  task: StructuredTaskSchema.optional(),
  error: z.string().optional(),
  processingTime: z.number().optional()
}); 