# Life Manager Backend

A Node.js backend service that processes text transcriptions into structured tasks using LLM (OpenAI) and saves them to a PocketBase database.

## Features

- 🎯 **Transcription Processing**: Convert natural language transcriptions into structured task data
- 🤖 **LLM Integration**: Uses OpenAI GPT-4 to intelligently extract task information
- 📊 **Structured Output**: Includes duration estimates, optimal outcomes, and success criteria
- 💾 **Database Storage**: Automatic saving to PocketBase with schema validation
- 🔍 **Task Management**: CRUD operations for tasks with filtering and pagination
- ⚡ **Batch Processing**: Handle multiple transcriptions simultaneously
- 🛡️ **Validation**: Comprehensive input/output validation using Zod schemas
- 🚦 **Rate Limiting**: Built-in rate limiting and security middleware

## Architecture

### Task Schema

The system processes transcriptions into structured tasks with the following information:

- **Basic Info**: Title, description, category, priority
- **Duration Estimation**: Value, unit (minutes/hours/days/weeks), confidence level
- **Optimal Outcome**: Description, success criteria, impact assessment, confidence
- **Metadata**: Tags, prerequisites, suggested deadline, processing information

### API Endpoints

#### Process Transcription
```http
POST /api/tasks/process
```

Convert a transcription into a structured task.

**Request Body:**
```json
{
  "transcription": "I need to prepare the quarterly sales report for next week's board meeting",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "voice",
    "userId": "user123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "title": "Prepare quarterly sales report for board meeting",
    "description": "Create comprehensive quarterly sales report for presentation to board",
    "category": "work",
    "priority": "high",
    "estimatedDuration": {
      "value": 4,
      "unit": "hours",
      "confidence": 0.8
    },
    "optimalOutcome": {
      "description": "Comprehensive quarterly sales report ready for board presentation",
      "successCriteria": [
        "All quarterly sales data compiled and analyzed",
        "Visual charts and graphs created",
        "Executive summary written",
        "Report formatted and proofread"
      ],
      "impact": "high",
      "confidence": 0.85
    },
    "suggestedDeadline": "2024-01-22T09:00:00Z",
    "tags": ["quarterly", "sales", "report", "board-meeting"],
    "originalTranscription": "I need to prepare the quarterly sales report for next week's board meeting",
    "processedAt": "2024-01-15T10:30:15Z",
    "llmModel": "gpt-4-turbo-preview",
    "processingConfidence": 0.9
  },
  "processingTime": 2450,
  "saved": true,
  "taskId": "abc123xyz"
}
```

#### Get Tasks
```http
GET /api/tasks
```

Retrieve tasks with optional filtering and pagination.

**Query Parameters:**
- `status`: Filter by task status (pending, in_progress, completed, cancelled)
- `category`: Filter by category (work, personal, health, etc.)
- `priority`: Filter by priority (low, medium, high, urgent)
- `userId`: Filter by user ID
- `page`: Page number (default: 1)
- `perPage`: Results per page (default: 20)

#### Get Single Task
```http
GET /api/tasks/:id
```

#### Update Task Status
```http
PATCH /api/tasks/:id/status
```

**Request Body:**
```json
{
  "status": "in_progress"
}
```

#### Batch Process
```http
POST /api/tasks/batch-process
```

Process multiple transcriptions at once (max 10).

**Request Body:**
```json
{
  "transcriptions": [
    {
      "transcription": "Call the dentist to schedule an appointment",
      "metadata": { "source": "voice" }
    },
    {
      "transcription": "Buy groceries for the week",
      "metadata": { "source": "text" }
    }
  ]
}
```

## Setup & Installation

### Prerequisites

1. **Node.js** (v18 or later)
2. **OpenAI API Key**
3. **PocketBase** instance running

### Installation

1. **Install dependencies using bun:**
   ```bash
   cd backend
   bun install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # PocketBase Configuration
   POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=admin@example.com
   POCKETBASE_ADMIN_PASSWORD=your_admin_password

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Start PocketBase:**
   Download and run PocketBase on port 8090 (default)

4. **Start the server:**
   ```bash
   # Development
   bun run dev

   # Production
   bun start
   ```

### PocketBase Setup

The backend will automatically:
- Create the `tasks` collection if it doesn't exist
- Set up the proper schema with all required fields
- Handle authentication if admin credentials are provided

## Usage Examples

### Processing a Simple Task
```javascript
const response = await fetch('http://localhost:3001/api/tasks/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transcription: "I need to call mom this weekend"
  })
});

const result = await response.json();
console.log(result.task.title); // "Call mom this weekend"
console.log(result.task.category); // "personal"
console.log(result.task.estimatedDuration); // { value: 30, unit: "minutes", confidence: 0.7 }
```

### Getting Tasks with Filters
```javascript
const response = await fetch('http://localhost:3001/api/tasks?status=pending&category=work&page=1');
const tasks = await response.json();
```

### Batch Processing
```javascript
const response = await fetch('http://localhost:3001/api/tasks/batch-process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transcriptions: [
      { transcription: "Schedule team meeting for next Tuesday" },
      { transcription: "Review and approve the marketing budget" },
      { transcription: "Update the project timeline" }
    ]
  })
});

const results = await response.json();
console.log(`Processed ${results.summary.total} tasks, ${results.summary.successful} successful`);
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "transcription",
      "message": "Transcription cannot be empty"
    }
  ]
}
```

## Monitoring

- Health check endpoint: `GET /health`
- Request logging with Morgan
- Error logging with stack traces in development
- Processing time tracking for performance monitoring

## Development

### Project Structure
```
backend/
├── src/
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── taskRoutes.js
│   ├── schemas/
│   │   └── taskSchema.js
│   ├── services/
│   │   ├── llmService.js
│   │   └── pocketbaseService.js
│   └── server.js
├── package.json
└── README.md
```

### Key Technologies
- **Express.js**: Web framework
- **OpenAI**: LLM processing
- **PocketBase**: Database
- **Zod**: Schema validation
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security middleware
- **Morgan**: HTTP request logging

## Contributing

1. Follow ES6+ standards
2. Use async/await for asynchronous operations
3. Validate all inputs with Zod schemas
4. Include proper error handling
5. Add console logging for debugging
6. Write descriptive commit messages 