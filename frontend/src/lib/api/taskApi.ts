import type { Task, Column, ApiResponse, CreateTaskRequest } from '$lib/types';

const API_BASE_URL = 'http://localhost:3001/api';

// Mock API responses for now - replace with real backend calls later
const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TaskApi {
  static async getAllTasks(): Promise<ApiResponse<Task[]>> {
    await mockDelay(500);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks`);
    // For now, return mock data
    return {
      success: true,
      data: [], // Will be populated from JSON file
      message: 'Tasks retrieved successfully'
    };
  }

  static async getTaskById(id: string): Promise<ApiResponse<Task>> {
    await mockDelay(300);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    throw new Error('Task not found');
  }

  static async createTask(task: CreateTaskRequest): Promise<ApiResponse<Task>> {
    await mockDelay(400);
    
    // This would be: 
    // const response = await fetch(`${API_BASE_URL}/tasks`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(task)
    // });
    
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
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    await mockDelay(400);
    
    // This would be:
    // const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updates)
    // });
    
    const updatedTask: Task = {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    } as Task;

    return {
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    };
  }

  static async deleteTask(id: string): Promise<ApiResponse<void>> {
    await mockDelay(300);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE' });
    
    return {
      success: true,
      data: undefined,
      message: 'Task deleted successfully'
    };
  }

  static async moveTask(id: string, newColumnId: string): Promise<ApiResponse<Task>> {
    await mockDelay(300);
    
    // This would be:
    // const response = await fetch(`${API_BASE_URL}/tasks/${id}/move`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ columnId: newColumnId })
    // });
    
    const movedTask: Task = {
      id,
      columnId: newColumnId,
      updatedAt: new Date().toISOString()
    } as Task;

    return {
      success: true,
      data: movedTask,
      message: 'Task moved successfully'
    };
  }

  static async searchTasks(query: string): Promise<ApiResponse<Task[]>> {
    await mockDelay(400);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/search?q=${encodeURIComponent(query)}`);
    
    return {
      success: true,
      data: [],
      message: 'Search completed'
    };
  }

  static async getTasksByColumn(columnId: string): Promise<ApiResponse<Task[]>> {
    await mockDelay(300);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/column/${columnId}`);
    
    return {
      success: true,
      data: [],
      message: 'Tasks retrieved by column'
    };
  }

  static async getTasksByContext(context: string): Promise<ApiResponse<Task[]>> {
    await mockDelay(300);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/context/${encodeURIComponent(context)}`);
    
    return {
      success: true,
      data: [],
      message: 'Tasks retrieved by context'
    };
  }

  static async getTasksByPriority(priority: string): Promise<ApiResponse<Task[]>> {
    await mockDelay(300);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/priority/${priority}`);
    
    return {
      success: true,
      data: [],
      message: 'Tasks retrieved by priority'
    };
  }

  static async getUpcomingTasks(days: number = 7): Promise<ApiResponse<Task[]>> {
    await mockDelay(400);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/upcoming?days=${days}`);
    
    return {
      success: true,
      data: [],
      message: 'Upcoming tasks retrieved'
    };
  }

  static async getTaskStatistics(): Promise<ApiResponse<{
    total: number;
    completed: number;
    highPriority: number;
    overdue: number;
    completionRate: number;
  }>> {
    await mockDelay(500);
    
    // This would be: const response = await fetch(`${API_BASE_URL}/tasks/statistics`);
    
    return {
      success: true,
      data: {
        total: 0,
        completed: 0,
        highPriority: 0,
        overdue: 0,
        completionRate: 0
      },
      message: 'Statistics retrieved'
    };
  }
} 