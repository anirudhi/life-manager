import OpenAI from 'openai';
import { SimpleTaskSchema } from '../schemas/taskSchema.js';
import dotenv from 'dotenv';
import { DatabaseTaskSchema } from '../schemas/taskSchema.js';
dotenv.config();

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = 'gpt-4o-mini';
  }

  async processTranscription(transcription, metadata = {}) {
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(transcription, metadata);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content;
      const parsedResponse = JSON.parse(responseContent);

      console.log('LLM parsed response:', parsedResponse);

      const processingTime = Date.now() - startTime;

      // Check if the transcription contains a valid task
      if (!parsedResponse.isTask) {
        return {
          success: true,
          isTask: false,
          message: "The transcription doesn't appear to contain a task.",
          processingTime
        };
      }

      // Validate the LLM output (optional, for error reporting)
      const llmValidation = SimpleTaskSchema.safeParse(parsedResponse);
      if (!llmValidation.success) {
        throw new Error('LLM output did not match SimpleTaskSchema: ' + JSON.stringify(llmValidation.error.issues));
      }

      // Add processing metadata
      const enrichedTask = {
        ...parsedResponse,
        originalTranscription: transcription,
        processedAt: new Date().toISOString(),
        llmModel: this.model,
        processingConfidence: this.calculateConfidence(completion, parsedResponse)
      };

      // Validate against DatabaseTaskSchema to ensure all required fields are present
      const dbTask = DatabaseTaskSchema.parse({
        ...enrichedTask,
        status: 'pending',
      });

      return {
        success: true,
        isTask: true,
        task: dbTask,
        message: "Task created successfully!",
        processingTime
      };

    } catch (error) {
      console.error('LLM processing error:', error);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        isTask: false,
        error: error.message || 'Failed to process transcription',
        message: "Failed to process the transcription.",
        processingTime
      };
    }
  }

  buildSystemPrompt() {
    return `You are an expert task management assistant that converts natural language transcriptions into structured task data.

Your job is to analyze a transcription and determine if it represents a task someone needs to do. If it does, extract structured information about it. If it doesn't contain a task, indicate that clearly.

IMPORTANT: You must respond with valid JSON only. Do not include any markdown formatting or code blocks.

The JSON response should have this exact structure:
{
  "isTask": boolean, // true if the transcription contains a task, false otherwise
  "title": "string (1-200 chars) - Clear, actionable task title (only if isTask is true)",
  "outcome": "string (1-500 chars) - What success looks like (only if isTask is true)",
  "section": "string - MUST be one of: 'can-do-now', 'today', 'waiting-for', 'recurring', 'someday', 'reference' (only if isTask is true)",
  "intensity": number (1-10) - How challenging/demanding this task is (only if isTask is true)",
  "tags": "string (max 200 chars) - Comma-separated relevant tags (only if isTask is true)",
  "dueDate": "ISO datetime string - When this should be completed (only if isTask is true)",
  "estimatedTime": number - Estimated time in minutes (only if isTask is true)
}

Guidelines:
- First determine if the transcription contains an actionable task
- If it's just a statement, question, or casual conversation, set isTask to false
- If it contains a task, extract all the required fields
- Be realistic with time estimates (in minutes)
- For section, use these exact values:
  * 'can-do-now': Tasks that can be done immediately
  * 'today': Tasks scheduled for today
  * 'waiting-for': Tasks waiting on someone else
  * 'recurring': Tasks that repeat regularly
  * 'someday': Future tasks or ideas
  * 'reference': Information to keep for reference
- Intensity should reflect complexity and effort required (1=very easy, 10=extremely challenging)
- For due dates, if not specified, suggest a reasonable timeframe based on the task
- Tags should be relevant keywords separated by commas
- Make outcomes specific and measurable when possible`;
  }

  buildUserPrompt(transcription, metadata) {
    let prompt = `Please analyze this transcription and determine if it contains a task:\n\n"${transcription}"`;

    if (metadata.timestamp) {
      prompt += `\n\nTimestamp: ${metadata.timestamp}`;
    }

    if (metadata.source) {
      prompt += `\nSource: ${metadata.source}`;
    }

    prompt += '\n\nRespond with valid JSON only.';

    return prompt;
  }

  calculateConfidence(completion, parsedResponse) {
    // Calculate confidence based on multiple factors
    let confidence = 0.8; // Base confidence

    // Adjust based on finish reason
    if (completion.choices[0].finish_reason === 'stop') {
      confidence += 0.1;
    } else if (completion.choices[0].finish_reason === 'length') {
      confidence -= 0.2;
    }

    // Adjust based on response completeness if it's a task
    if (parsedResponse.isTask) {
      const requiredFields = ['title', 'outcome', 'section', 'intensity', 'tags', 'dueDate', 'estimatedTime'];
      const presentFields = requiredFields.filter(field => parsedResponse[field]);
      const completeness = presentFields.length / requiredFields.length;
      confidence = confidence * completeness;
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }
}

export const llmService = new LLMService(); 