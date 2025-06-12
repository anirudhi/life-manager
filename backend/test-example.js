#!/usr/bin/env node

/**
 * Test example for the Life Manager Backend
 * This demonstrates how to use the API to process transcriptions into structured tasks
 */

const BASE_URL = 'http://localhost:3001';

// Example transcriptions to test with
const testTranscriptions = [
  {
    transcription: "I need to prepare the quarterly sales report for next week's board meeting",
    metadata: {
      timestamp: new Date().toISOString(),
      source: "voice",
      userId: "test-user-1"
    }
  },
  {
    transcription: "Call the dentist to schedule my annual cleaning appointment",
    metadata: {
      timestamp: new Date().toISOString(),
      source: "voice",
      userId: "test-user-1"
    }
  },
  {
    transcription: "Buy groceries for the week including milk, bread, eggs, and vegetables",
    metadata: {
      timestamp: new Date().toISOString(),
      source: "text",
      userId: "test-user-1"
    }
  },
  {
    transcription: "Review and approve the marketing budget proposal before Friday",
    metadata: {
      timestamp: new Date().toISOString(),
      source: "voice",
      userId: "test-user-1"
    }
  },
  {
    transcription: "Start learning Spanish for the upcoming trip to Mexico",
    metadata: {
      timestamp: new Date().toISOString(),
      source: "text",
      userId: "test-user-1"
    }
  }
];

async function checkHealth() {
  try {
    console.log('🔍 Checking server health...');
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Server is healthy:', data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

async function processTranscription(transcriptionData) {
  try {
    console.log(`📝 Processing: "${transcriptionData.transcription.substring(0, 50)}..."`);

    const response = await fetch(`${BASE_URL}/api/tasks/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptionData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Successfully processed task:');
      console.log('  Title:', result.task.title);
      console.log('  Category:', result.task.category);
      console.log('  Priority:', result.task.priority);
      console.log('  Duration:', `${result.task.estimatedDuration.value} ${result.task.estimatedDuration.unit}`);
      console.log('  Outcome:', result.task.optimalOutcome.description);
      console.log('  Processing Time:', `${result.processingTime}ms`);
      console.log('  Saved to DB:', result.saved);
      if (result.taskId) {
        console.log('  Task ID:', result.taskId);
      }
      console.log('');
      return result;
    } else {
      console.error('❌ Failed to process task:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error processing transcription:', error.message);
    return null;
  }
}

async function batchProcessTranscriptions(transcriptions) {
  try {
    console.log(`🔄 Batch processing ${transcriptions.length} transcriptions...`);

    const response = await fetch(`${BASE_URL}/api/tasks/batch-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcriptions })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Batch processing completed:');
      console.log('  Total:', result.summary.total);
      console.log('  Successful:', result.summary.successful);
      console.log('  Failed:', result.summary.failed);
      console.log('  Total Time:', `${result.summary.totalProcessingTime}ms`);
      console.log('');
      return result;
    } else {
      console.error('❌ Batch processing failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in batch processing:', error.message);
    return null;
  }
}

async function getTasks() {
  try {
    console.log('📋 Fetching all tasks...');

    const response = await fetch(`${BASE_URL}/api/tasks`);
    const result = await response.json();

    if (result.success) {
      console.log(`✅ Retrieved ${result.tasks.length} tasks:`);
      result.tasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title} (${task.status}) - ${task.category}`);
      });
      console.log('');
      return result;
    } else {
      console.error('❌ Failed to get tasks:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.message);
    return null;
  }
}

async function getTasksByCategory(category) {
  try {
    console.log(`📋 Fetching ${category} tasks...`);

    const response = await fetch(`${BASE_URL}/api/tasks?category=${category}`);
    const result = await response.json();

    if (result.success) {
      console.log(`✅ Retrieved ${result.tasks.length} ${category} tasks:`);
      result.tasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title} (${task.priority})`);
      });
      console.log('');
      return result;
    } else {
      console.error('❌ Failed to get tasks:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Life Manager Backend Tests\n');

  // Check if server is running
  if (!(await checkHealth())) {
    console.log('❌ Server is not running. Please start the server first with "bun run dev"');
    return;
  }

  console.log('📝 Testing individual transcription processing...\n');

  // Test individual processing
  const processedTasks = [];
  for (const transcription of testTranscriptions.slice(0, 3)) {
    const result = await processTranscription(transcription);
    if (result) {
      processedTasks.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between requests
  }

  console.log('🔄 Testing batch processing...\n');

  // Test batch processing
  await batchProcessTranscriptions(testTranscriptions.slice(3));

  console.log('📋 Testing task retrieval...\n');

  // Test getting all tasks
  await getTasks();

  // Test filtering by category
  await getTasksByCategory('work');
  await getTasksByCategory('personal');

  console.log('✅ All tests completed!\n');

  console.log('💡 Next steps:');
  console.log('1. Check the PocketBase admin panel to see the created tasks');
  console.log('2. Try the API endpoints with your own transcriptions');
  console.log('3. Integrate with your mobile app or other clients');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
} 