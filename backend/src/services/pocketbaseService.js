import PocketBase from 'pocketbase';
import { DatabaseTaskSchema } from '../schemas/taskSchema.js';

class PocketBaseService {
  constructor() {
    this.pb = new PocketBase('https://life-manager-database1-wispy-thunder-4413.fly.dev');
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

      this.initialized = true;
      console.log('✅ PocketBase service initialized');
    } catch (error) {
      console.error('❌ PocketBase initialization failed:', error.message);
      throw error;
    }
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
      if (filters.section) {
        if (filterString) filterString += ' && ';
        filterString += `section = "${filters.section}"`;
      }
      if (filters.intensity) {
        if (filterString) filterString += ' && ';
        filterString += `intensity = ${filters.intensity}`;
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

    if (pbData.dueDate) {
      pbData.dueDate = new Date(pbData.dueDate);
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

    if (taskData.dueDate) {
      taskData.dueDate = new Date(taskData.dueDate).toISOString();
    }

    if (taskData.created) {
      taskData.created = new Date(taskData.created).toISOString();
    }

    if (taskData.updated) {
      taskData.updated = new Date(taskData.updated).toISOString();
    }

    return taskData;
  }

  async createDemoTask() {
    const demoTask = {
      title: 'Demo Task',
      outcome: 'This is a demo task created on startup.',
      section: 'can-do-now',
      intensity: 1,
      tags: 'demo,test',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
      estimatedTime: 30, // 30 minutes
      status: 'pending'
    };

    return this.saveTask(demoTask);
  }
}

export const pocketbaseService = new PocketBaseService(); 