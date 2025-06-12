// API integration for the GTD Life Manager
// This connects to the backend Express server

const API_BASE_URL = 'http://localhost:3001/api';

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedTime: number;
  context: string;
  energy: 'high' | 'medium' | 'low' | 'none';
  waitingFor?: string;
  subtasks?: string[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  columnId: string;
  priority: Task['priority'];
  tags: string[];
  dueDate?: string;
  estimatedTime?: number;
  context: string;
  energy: Task['energy'];
  waitingFor?: string;
  subtasks?: string[];
}

// Mock delay for realistic API simulation
const mockDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export class TaskAPI {
  static async getAllTasks(): Promise<ApiResponse<Task[]>> {
    try {
      await mockDelay();
      
      // In production, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks`);
      // const data = await response.json();
      // return data;
      
      // For now, return empty array - the store provides sample data
      return {
        success: true,
        data: [],
        message: 'Tasks retrieved successfully'
      };
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch tasks'
      };
    }
  }

  static async createTask(task: CreateTaskRequest): Promise<ApiResponse<Task>> {
    try {
      await mockDelay();
      
      // In production, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(task)
      // });
      // const data = await response.json();
      // return data;
      
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...task,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: newTask,
        message: 'Task created successfully'
      };
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error('Failed to create task');
    }
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    try {
      await mockDelay();
      
      // In production, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // const data = await response.json();
      // return data;
      
      return {
        success: true,
        data: { id, ...updates, updatedAt: new Date().toISOString() } as Task,
        message: 'Task updated successfully'
      };
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error('Failed to update task');
    }
  }

  static async deleteTask(id: string): Promise<ApiResponse<void>> {
    try {
      await mockDelay();
      
      // In production, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      //   method: 'DELETE'
      // });
      // const data = await response.json();
      // return data;
      
      return {
        success: true,
        data: undefined,
        message: 'Task deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw new Error('Failed to delete task');
    }
  }

  static async moveTask(id: string, newColumnId: string): Promise<ApiResponse<Task>> {
    try {
      await mockDelay(150);
      
      // In production, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks/${id}/move`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ columnId: newColumnId })
      // });
      // const data = await response.json();
      // return data;
      
      return {
        success: true,
        data: { id, columnId: newColumnId, updatedAt: new Date().toISOString() } as Task,
        message: 'Task moved successfully'
      };
    } catch (error) {
      console.error('Failed to move task:', error);
      throw new Error('Failed to move task');
    }
  }

  static async searchTasks(query: string): Promise<ApiResponse<Task[]>> {
    try {
      await mockDelay(400);
      
      // In production, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks/search?q=${encodeURIComponent(query)}`);
      // const data = await response.json();
      // return data;
      
      return {
        success: true,
        data: [],
        message: 'Search completed'
      };
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return {
        success: false,
        data: [],
        message: 'Search failed'
      };
    }
  }

  static async syncWithBackend(): Promise<boolean> {
    try {
      // Health check
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.warn('Backend not available, using local data');
      return false;
    }
  }
}

// Export for easy importing
export default TaskAPI; 