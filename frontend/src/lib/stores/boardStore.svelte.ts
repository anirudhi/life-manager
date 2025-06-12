// Types defined inline
interface Column {
  id: string;
  title: string;
  description: string;
  color: string;
}

interface Task {
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

interface Priority {
  value: string;
  label: string;
  color: string;
}

interface EnergyLevel {
  value: string;
  label: string;
  color: string;
}

interface BoardData {
  columns: Column[];
  tasks: Task[];
  contexts: string[];
  priorities: Priority[];
  energyLevels: EnergyLevel[];
}

// Complete sample data inline
const sampleData: BoardData = {
  columns: [
    {
      id: "inbox",
      title: "📥 Inbox",
      description: "Capture everything that needs attention",
      color: "bg-gray-100"
    },
    {
      id: "next-actions",
      title: "🎯 Next Actions",
      description: "Tasks ready to be done",
      color: "bg-blue-100"
    },
    {
      id: "waiting-for",
      title: "⏳ Waiting For",
      description: "Delegated tasks or dependencies",
      color: "bg-yellow-100"
    },
    {
      id: "projects",
      title: "📋 Projects",
      description: "Multi-step outcomes",
      color: "bg-green-100"
    },
    {
      id: "someday-maybe",
      title: "💭 Someday/Maybe",
      description: "Ideas for the future",
      color: "bg-purple-100"
    },
    {
      id: "reference",
      title: "📚 Reference",
      description: "Information to keep",
      color: "bg-orange-100"
    }
  ],
  tasks: [
    {
      id: "task-1",
      title: "Review quarterly goals",
      description: "Analyze Q3 performance and set Q4 objectives",
      columnId: "inbox",
      priority: "high",
      tags: ["business", "planning"],
      dueDate: "2024-01-15",
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-01T10:00:00Z",
      estimatedTime: 120,
      context: "@computer",
      energy: "high"
    },
    {
      id: "task-2",
      title: "Call dentist for appointment",
      description: "Schedule routine cleaning",
      columnId: "next-actions",
      priority: "medium",
      tags: ["health", "personal"],
      dueDate: "2024-01-10",
      createdAt: "2024-01-01T11:00:00Z",
      updatedAt: "2024-01-01T11:00:00Z",
      estimatedTime: 15,
      context: "@phone",
      energy: "low"
    },
    {
      id: "task-3",
      title: "Waiting for design feedback from client",
      description: "Sent mockups on Monday, expecting response by Friday",
      columnId: "waiting-for",
      priority: "high",
      tags: ["work", "design"],
      dueDate: "2024-01-12",
      createdAt: "2024-01-08T09:00:00Z",
      updatedAt: "2024-01-08T09:00:00Z",
      estimatedTime: 0,
      context: "@waiting",
      energy: "none",
      waitingFor: "client"
    },
    {
      id: "task-4",
      title: "Mobile App Development",
      description: "Build React Native app for task management",
      columnId: "projects",
      priority: "high",
      tags: ["development", "mobile"],
      dueDate: "2024-03-01",
      createdAt: "2024-01-01T08:00:00Z",
      updatedAt: "2024-01-01T08:00:00Z",
      estimatedTime: 2400,
      context: "@computer",
      energy: "high",
      subtasks: [
        "Set up development environment",
        "Create app wireframes",
        "Implement core features",
        "Testing and deployment"
      ]
    },
    {
      id: "task-5",
      title: "Learn Spanish",
      description: "Complete beginner Spanish course",
      columnId: "someday-maybe",
      priority: "low",
      tags: ["learning", "personal"],
      dueDate: null,
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
      estimatedTime: 6000,
      context: "@anywhere",
      energy: "medium"
    },
    {
      id: "task-6",
      title: "Important client contact info",
      description: "Key stakeholder details for ABC Corp project",
      columnId: "reference",
      priority: "none",
      tags: ["reference", "contacts"],
      dueDate: null,
      createdAt: "2024-01-01T14:00:00Z",
      updatedAt: "2024-01-01T14:00:00Z",
      estimatedTime: 0,
      context: "@reference",
      energy: "none"
    },
    {
      id: "task-7",
      title: "Prepare presentation slides",
      description: "Create slides for monthly team meeting",
      columnId: "next-actions",
      priority: "high",
      tags: ["work", "presentation"],
      dueDate: "2024-01-16",
      createdAt: "2024-01-02T09:00:00Z",
      updatedAt: "2024-01-02T09:00:00Z",
      estimatedTime: 90,
      context: "@computer",
      energy: "high"
    },
    {
      id: "task-8",
      title: "Buy groceries",
      description: "Weekly grocery shopping - check list in notes app",
      columnId: "next-actions",
      priority: "medium",
      tags: ["errands", "personal"],
      dueDate: "2024-01-11",
      createdAt: "2024-01-03T16:00:00Z",
      updatedAt: "2024-01-03T16:00:00Z",
      estimatedTime: 45,
      context: "@errands",
      energy: "medium"
    },
    {
      id: "task-9",
      title: "Website Redesign Project",
      description: "Complete overhaul of company website",
      columnId: "projects",
      priority: "high",
      tags: ["web", "design", "work"],
      dueDate: "2024-02-15",
      createdAt: "2024-01-01T10:30:00Z",
      updatedAt: "2024-01-01T10:30:00Z",
      estimatedTime: 1800,
      context: "@computer",
      energy: "high",
      subtasks: [
        "Conduct user research",
        "Create new design system",
        "Develop responsive layouts",
        "Implement CMS integration",
        "User testing and feedback"
      ]
    },
    {
      id: "task-10",
      title: "Tax documents from accountant",
      description: "Waiting for final tax preparation documents",
      columnId: "waiting-for",
      priority: "high",
      tags: ["finance", "taxes"],
      dueDate: "2024-01-31",
      createdAt: "2024-01-05T11:00:00Z",
      updatedAt: "2024-01-05T11:00:00Z",
      estimatedTime: 0,
      context: "@waiting",
      energy: "none",
      waitingFor: "accountant"
    }
  ],
  contexts: [
    "@computer",
    "@phone",
    "@errands",
    "@home",
    "@office",
    "@anywhere",
    "@waiting",
    "@reference"
  ],
  priorities: [
    { value: "high", label: "High", color: "bg-red-100 text-red-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "none", label: "None", color: "bg-gray-100 text-gray-600" }
  ],
  energyLevels: [
    { value: "high", label: "High Energy", color: "bg-red-50" },
    { value: "medium", label: "Medium Energy", color: "bg-yellow-50" },
    { value: "low", label: "Low Energy", color: "bg-green-50" },
    { value: "none", label: "No Energy Required", color: "bg-gray-50" }
  ]
};

// Create reactive state using Svelte 5 runes
export class BoardStore {
  private data = $state<BoardData>(structuredClone(sampleData));

  get columns(): Column[] {
    return this.data.columns;
  }

  get tasks(): Task[] {
    return this.data.tasks;
  }

  get contexts(): string[] {
    return this.data.contexts;
  }

  get priorities() {
    return this.data.priorities;
  }

  get energyLevels() {
    return this.data.energyLevels;
  }

  getTasksByColumn(columnId: string): Task[] {
    return this.data.tasks.filter(task => task.columnId === columnId);
  }

  getTaskById(taskId: string): Task | undefined {
    return this.data.tasks.find(task => task.id === taskId);
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.tasks.push(newTask);
    return newTask;
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const taskIndex = this.data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.data.tasks[taskIndex] = {
        ...this.data.tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
  }

  deleteTask(taskId: string): void {
    this.data.tasks = this.data.tasks.filter(task => task.id !== taskId);
  }

  moveTask(taskId: string, newColumnId: string): void {
    const taskIndex = this.data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.data.tasks[taskIndex] = {
        ...this.data.tasks[taskIndex],
        columnId: newColumnId,
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Search and filter functions
  searchTasks(query: string): Task[] {
    const lowercaseQuery = query.toLowerCase();
    return this.data.tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  filterTasksByContext(context: string): Task[] {
    return this.data.tasks.filter(task => task.context === context);
  }

  filterTasksByPriority(priority: string): Task[] {
    return this.data.tasks.filter(task => task.priority === priority);
  }

  filterTasksByEnergy(energy: string): Task[] {
    return this.data.tasks.filter(task => task.energy === energy);
  }

  getTasksWithUpcomingDueDates(days: number = 7): Task[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.data.tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= futureDate;
    });
  }

  // Statistics
  getTaskStatistics() {
    const totalTasks = this.data.tasks.length;
    const completedTasks = 0; // No completed column in GTD
    const highPriorityTasks = this.data.tasks.filter(task => task.priority === 'high').length;
    const overdueTasks = this.data.tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date();
    }).length;

    return {
      total: totalTasks,
      completed: completedTasks,
      highPriority: highPriorityTasks,
      overdue: overdueTasks,
      completionRate: 0
    };
  }
}

// Create a singleton instance
export const boardStore = new BoardStore();

// Export types for use in components
export type { Task, Column, BoardData, Priority, EnergyLevel }; 