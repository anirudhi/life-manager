export interface Column {
  id: string;
  title: string;
  description: string;
  color: string;
}

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
  estimatedTime: number; // in minutes
  context: string;
  energy: 'high' | 'medium' | 'low' | 'none';
  waitingFor?: string;
  subtasks?: string[];
}

export interface Priority {
  value: string;
  label: string;
  color: string;
}

export interface EnergyLevel {
  value: string;
  label: string;
  color: string;
}

export interface BoardData {
  columns: Column[];
  tasks: Task[];
  contexts: string[];
  priorities: Priority[];
  energyLevels: EnergyLevel[];
}

export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: Task;
    };
  };
  over: {
    id: string;
  } | null;
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
} 