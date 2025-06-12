import PocketBase from 'pocketbase';
import { DatabaseTaskSchema } from '../schemas/taskSchema.js';

class PocketBaseService {
  constructor() {
    this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    this.collectionName = 'tasks';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Try to authenticate as admin if credentials are provided
      if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
        await this.pb.admins.authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL,
          process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('✅ PocketBase admin authenticated');
      }

      // Ensure the tasks collection exists
      await this.ensureTasksCollection();
      this.initialized = true;
      console.log('✅ PocketBase service initialized');
    } catch (error) {
      console.error('❌ PocketBase initialization failed:', error.message);
      throw error;
    }
  }

  async ensureTasksCollection() {
    try {
      // Try to get the collection
      await this.pb.collections.getOne(this.collectionName);
      console.log(`✅ Collection '${this.collectionName}' exists`);
    } catch (error) {
      if (error.status === 404) {
        // Collection doesn't exist, create it
        console.log(`📝 Creating collection '${this.collectionName}'...`);
        await this.createTasksCollection();
      } else {
        throw error;
      }
    }
  }

  async createTasksCollection() {
    const collectionSchema = {
      name: this.collectionName,
      type: 'base',
      schema: [
        {
          name: 'title',
          type: 'text',
          required: true,
          options: { max: 200 }
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          options: { max: 1000 }
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          options: {
            values: ['work', 'personal', 'health', 'learning', 'creative', 'social', 'maintenance', 'other']
          }
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          options: {
            values: ['low', 'medium', 'high', 'urgent']
          }
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['pending', 'in_progress', 'completed', 'cancelled']
          }
        },
        {
          name: 'estimatedDuration',
          type: 'json',
          required: true
        },
        {
          name: 'optimalOutcome',
          type: 'json',
          required: true
        },
        {
          name: 'suggestedDeadline',
          type: 'date',
          required: false
        },
        {
          name: 'prerequisites',
          type: 'json',
          required: false
        },
        {
          name: 'tags',
          type: 'json',
          required: false
        },
        {
          name: 'originalTranscription',
          type: 'text',
          required: true,
          options: { max: 5000 }
        },
        {
          name: 'processedAt',
          type: 'date',
          required: true
        },
        {
          name: 'llmModel',
          type: 'text',
          required: true
        },
        {
          name: 'processingConfidence',
          type: 'number',
          required: true
        },
        {
          name: 'userId',
          type: 'text',
          required: false
        }
      ]
    };

    const collection = await this.pb.collections.create(collectionSchema);
    console.log(`✅ Collection '${this.collectionName}' created successfully`);
    return collection;
  }

  async saveTask(taskData) {
    try {
      // Ensure service is initialized
      await this.initialize();

      // Validate the data
      const validatedTask = DatabaseTaskSchema.parse({
        ...taskData,
        status: 'pending' // Set default status
      });

      // Transform the data for PocketBase
      const pbData = this.transformForPocketBase(validatedTask);

      const record = await this.pb.collection(this.collectionName).create(pbData);

      console.log(`✅ Task saved to PocketBase with ID: ${record.id}`);
      return {
        success: true,
        id: record.id,
        task: record
      };
    } catch (error) {
      console.error('❌ Failed to save task to PocketBase:', error);
      return {
        success: false,
        error: error.message || 'Failed to save task'
      };
    }
  }

  async getTask(id) {
    try {
      await this.initialize();

      const record = await this.pb.collection(this.collectionName).getOne(id);
      const transformedTask = this.transformFromPocketBase(record);

      return {
        success: true,
        task: transformedTask
      };
    } catch (error) {
      console.error(`❌ Failed to get task ${id}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve task'
      };
    }
  }

  async getTasks(filters = {}, page = 1, perPage = 20) {
    try {
      await this.initialize();

      let filterString = '';
      if (filters.status) {
        filterString += `status = "${filters.status}"`;
      }
      if (filters.category) {
        if (filterString) filterString += ' && ';
        filterString += `category = "${filters.category}"`;
      }
      if (filters.priority) {
        if (filterString) filterString += ' && ';
        filterString += `priority = "${filters.priority}"`;
      }
      if (filters.userId) {
        if (filterString) filterString += ' && ';
        filterString += `userId = "${filters.userId}"`;
      }

      const resultList = await this.pb.collection(this.collectionName).getList(
        page,
        perPage,
        {
          filter: filterString,
          sort: '-created'
        }
      );

      const transformedTasks = resultList.items.map(record =>
        this.transformFromPocketBase(record)
      );

      return {
        success: true,
        tasks: transformedTasks,
        page: resultList.page,
        perPage: resultList.perPage,
        totalItems: resultList.totalItems,
        totalPages: resultList.totalPages
      };
    } catch (error) {
      console.error('❌ Failed to get tasks:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve tasks'
      };
    }
  }

  async updateTaskStatus(id, status) {
    try {
      await this.initialize();

      const record = await this.pb.collection(this.collectionName).update(id, {
        status: status
      });

      return {
        success: true,
        task: this.transformFromPocketBase(record)
      };
    } catch (error) {
      console.error(`❌ Failed to update task ${id} status:`, error);
      return {
        success: false,
        error: error.message || 'Failed to update task status'
      };
    }
  }

  transformForPocketBase(taskData) {
    // Convert date strings to Date objects for PocketBase
    const pbData = { ...taskData };

    if (pbData.processedAt) {
      pbData.processedAt = new Date(pbData.processedAt);
    }

    if (pbData.suggestedDeadline) {
      pbData.suggestedDeadline = new Date(pbData.suggestedDeadline);
    }

    return pbData;
  }

  transformFromPocketBase(record) {
    // Convert PocketBase record back to our schema format
    const taskData = { ...record };

    // Convert dates back to ISO strings
    if (taskData.processedAt) {
      taskData.processedAt = new Date(taskData.processedAt).toISOString();
    }

    if (taskData.suggestedDeadline) {
      taskData.suggestedDeadline = new Date(taskData.suggestedDeadline).toISOString();
    }

    if (taskData.created) {
      taskData.created = new Date(taskData.created).toISOString();
    }

    if (taskData.updated) {
      taskData.updated = new Date(taskData.updated).toISOString();
    }

    return taskData;
  }
}

export const pocketbaseService = new PocketBaseService(); 