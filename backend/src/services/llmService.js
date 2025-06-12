import OpenAI from 'openai';
import { StructuredTaskSchema } from '../schemas/taskSchema.js';

class LLMService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = 'gpt-4-turbo-preview';
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

      // Add processing metadata
      const enrichedTask = {
        ...parsedResponse,
        originalTranscription: transcription,
        processedAt: new Date().toISOString(),
        llmModel: this.model,
        processingConfidence: this.calculateConfidence(completion, parsedResponse)
      };

      // Validate the response against our schema
      const validatedTask = StructuredTaskSchema.parse(enrichedTask);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        task: validatedTask,
        processingTime
      };

    } catch (error) {
      console.error('LLM processing error:', error);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message || 'Failed to process transcription',
        processingTime
      };
    }
  }

  buildSystemPrompt() {
    return `You are an expert task management assistant that converts natural language transcriptions into structured task data.

Your job is to analyze a transcription that represents a task someone needs to do and extract structured information about it.

IMPORTANT: You must respond with valid JSON only. Do not include any markdown formatting or code blocks.

The JSON response should have this exact structure:
{
  "title": "string (1-200 chars) - Clear, actionable task title",
  "description": "string (optional, max 1000 chars) - Detailed description if needed",
  "category": "enum: work|personal|health|learning|creative|social|maintenance|other",
  "priority": "enum: low|medium|high|urgent - Based on urgency and importance",
  "estimatedDuration": {
    "value": "number (positive) - Duration amount",
    "unit": "enum: minutes|hours|days|weeks - Appropriate time unit",
    "confidence": "number (0-1) - How confident you are in this estimate"
  },
  "optimalOutcome": {
    "description": "string (1-500 chars) - What success looks like",
    "successCriteria": ["array of strings (max 200 chars each) - Measurable success indicators"],
    "impact": "enum: low|medium|high - Expected impact of completing this task",
    "confidence": "number (0-1) - Confidence in outcome prediction"
  },
  "suggestedDeadline": "ISO datetime string (optional) - When this should ideally be completed",
  "prerequisites": ["array of strings (optional, max 200 chars each) - What needs to be done first"],
  "tags": ["array of strings (optional, max 50 chars each) - Relevant tags"],
  "processingConfidence": "number (0-1) - Overall confidence in the task extraction"
}

Guidelines:
- Be realistic with duration estimates
- Consider the complexity and scope when estimating
- Make success criteria specific and measurable
- Choose appropriate categories and priorities
- If the transcription is unclear, use lower confidence scores
- Extract the core intent even from casual language
- Consider context clues for urgency and importance`;
  }

  buildUserPrompt(transcription, metadata) {
    let prompt = `Please process this transcription into a structured task:\n\n"${transcription}"`;

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

    // Adjust based on response completeness
    const requiredFields = ['title', 'category', 'priority', 'estimatedDuration', 'optimalOutcome'];
    const presentFields = requiredFields.filter(field => parsedResponse[field]);
    const completeness = presentFields.length / requiredFields.length;
    confidence = confidence * completeness;

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }
}

export const llmService = new LLMService(); 