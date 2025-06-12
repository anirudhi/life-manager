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

// New simplified task schema based on user requirements
export const SimpleTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  outcome: z.string().min(1, 'Outcome is required').max(500),
  section: z.string().min(1, 'Section is required').max(100),
  intensity: z.number().int().min(1).max(10, 'Intensity must be between 1-10'),
  tags: z.string().max(200),
  dueDate: z.string().datetime(),
  estimatedTime: z.number().positive('Estimated time must be positive'),
  isTask: z.boolean().default(true) // To determine if transcription contained a valid task
});

// Database task schema (what gets saved to PocketBase)
export const DatabaseTaskSchema = SimpleTaskSchema.extend({
  id: z.string().optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  userId: z.string().optional(),
  originalTranscription: z.string(),
  processedAt: z.string().datetime(),
  llmModel: z.string(),
  processingConfidence: z.number().min(0).max(1)
});

// API response schema
export const TaskProcessingResponseSchema = z.object({
  success: z.boolean(),
  task: SimpleTaskSchema.optional(),
  isTask: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
  processingTime: z.number().optional()
});

// Legacy schemas for backward compatibility
export const DurationSchema = z.object({
  value: z.number().positive('Duration must be positive'),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks']),
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
});

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

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