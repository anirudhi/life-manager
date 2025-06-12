import express from 'express';
import { TranscriptionInputSchema } from '../schemas/taskSchema.js';
import { llmService } from '../services/llmService.js';
import { pocketbaseService } from '../services/pocketbaseService.js';

const router = express.Router();

// POST /api/tasks/process - Process transcription into structured task
router.post('/process', async (req, res, next) => {
  try {
    // Validate input
    const validatedInput = TranscriptionInputSchema.parse(req.body);

    console.log('📝 Processing transcription:', {
      length: validatedInput.transcription.length,
      source: validatedInput.metadata?.source || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Process with LLM
    const llmResult = await llmService.processTranscription(
      validatedInput.transcription,
      validatedInput.metadata
    );

    if (!llmResult.success) {
      return res.status(400).json({
        success: false,
        isTask: false,
        message: llmResult.message || 'Failed to process transcription',
        error: llmResult.error,
        processingTime: llmResult.processingTime
      });
    }

    // If it's not a task, return without saving
    if (!llmResult.isTask) {
      return res.status(200).json({
        success: true,
        isTask: false,
        message: llmResult.message,
        processingTime: llmResult.processingTime
      });
    }

    // Save to PocketBase only if it's a valid task
    const saveResult = await pocketbaseService.saveTask(llmResult.task);

    if (!saveResult.success) {
      console.warn('⚠️ Task processed but failed to save to database:', saveResult.error);
      return res.status(201).json({
        success: true,
        isTask: true,
        message: 'Task created but failed to save to database',
        task: llmResult.task,
        processingTime: llmResult.processingTime,
        saved: false,
        saveError: saveResult.error
      });
    }

    console.log('✅ Task processed and saved successfully');
    res.status(201).json({
      success: true,
      isTask: true,
      message: 'Task created successfully!',
      task: llmResult.task,
      processingTime: llmResult.processingTime,
      saved: true,
      taskId: saveResult.id
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/tasks - Get all tasks with optional filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      section,
      intensity,
      userId,
      page = 1,
      perPage = 20
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (section) filters.section = section;
    if (intensity) filters.intensity = intensity;
    if (userId) filters.userId = userId;

    const result = await pocketbaseService.getTasks(
      filters,
      parseInt(page),
      parseInt(perPage)
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);

  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pocketbaseService.getTask(id);

    if (!result.success) {
      const statusCode = result.error.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);

  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (pending, in_progress, completed, cancelled)'
      });
    }

    const result = await pocketbaseService.updateTaskStatus(id, status);

    if (!result.success) {
      const statusCode = result.error.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

    res.json(result);

  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/batch-process - Process multiple transcriptions
router.post('/batch-process', async (req, res, next) => {
  try {
    const { transcriptions } = req.body;

    if (!Array.isArray(transcriptions) || transcriptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'transcriptions array is required and cannot be empty'
      });
    }

    if (transcriptions.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 transcriptions allowed per batch'
      });
    }

    const results = [];
    const startTime = Date.now();

    for (const transcriptionData of transcriptions) {
      try {
        const validatedInput = TranscriptionInputSchema.parse(transcriptionData);
        const llmResult = await llmService.processTranscription(
          validatedInput.transcription,
          validatedInput.metadata
        );

        if (llmResult.success && llmResult.isTask) {
          const saveResult = await pocketbaseService.saveTask(llmResult.task);
          results.push({
            success: true,
            isTask: true,
            task: llmResult.task,
            saved: saveResult.success,
            taskId: saveResult.id,
            originalTranscription: validatedInput.transcription
          });
        } else {
          results.push({
            success: llmResult.success,
            isTask: llmResult.isTask,
            message: llmResult.message,
            error: llmResult.error,
            originalTranscription: validatedInput.transcription
          });
        }
      } catch (error) {
        results.push({
          success: false,
          isTask: false,
          error: error.message,
          originalTranscription: transcriptionData?.transcription || 'Invalid input'
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success && r.isTask).length;

    res.json({
      success: true,
      results,
      summary: {
        total: transcriptions.length,
        successful: successCount,
        failed: transcriptions.length - successCount,
        totalProcessingTime
      }
    });

  } catch (error) {
    next(error);
  }
});

export { router as taskRoutes }; 