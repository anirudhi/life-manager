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
  outcome: string;
  intensity: number;
  tags: string[];
  dueDate: string | null;
  estimatedTime: number;
  created: string;
  updated: string;
  section: string;
  started?: boolean;
  startTime?: string;
  endTime?: string;
  waitingFor?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  context?: string;
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
      id: "today",
      title: "📅 Today",
      description: "Tasks scheduled for today",
      color: "bg-indigo-100"
    },
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
      title: "Review and respond to emails",
      outcome: "Clear inbox and respond to urgent messages",
      intensity: 3,
      tags: ["work", "communication"],
      dueDate: new Date().toISOString(),
      estimatedTime: 30,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      section: "can-do-now"
    },
    {
      id: "task-2",
      title: "Update project documentation",
      outcome: "Document latest API changes and update user guides",
      intensity: 2,
      tags: ["work", "documentation"],
      dueDate: new Date().toISOString(),
      estimatedTime: 45,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      section: "can-do-now"
    },
    {
      id: "task-today-1",
      title: "Team Standup Meeting",
      outcome: "Daily team sync and progress update",
      intensity: 3,
      tags: ["meeting", "work"],
      dueDate: "2024-01-15",
      estimatedTime: 30,
      created: "2024-01-15T08:00:00Z",
      updated: "2024-01-15T08:00:00Z",
      section: "today",
      priority: "high",
      context: "@computer",
      startTime: "09:00",
      endTime: "09:30"
    },
    {
      id: "task-today-2",
      title: "Review Project Proposal",
      outcome: "Final review of Q1 project proposal",
      intensity: 3,
      tags: ["work", "review"],
      dueDate: "2024-01-15",
      estimatedTime: 60,
      created: "2024-01-15T08:00:00Z",
      updated: "2024-01-15T08:00:00Z",
      section: "today",
      priority: "high",
      context: "@computer",
      startTime: "10:00",
      endTime: "11:00"
    },
    {
      id: "task-today-3",
      title: "Lunch with Client",
      outcome: "Discuss new project requirements",
      intensity: 2,
      tags: ["meeting", "client"],
      dueDate: "2024-01-15",
      estimatedTime: 90,
      created: "2024-01-15T08:00:00Z",
      updated: "2024-01-15T08:00:00Z",
      section: "today",
      context: "@office",
      startTime: "12:30",
      endTime: "14:00"
    },
    {
      id: "task-3",
      title: "Waiting for design feedback from client",
      outcome: "Sent mockups on Monday, expecting response by Friday",
      intensity: 0,
      tags: ["work", "design"],
      dueDate: "2024-01-12",
      estimatedTime: 0,
      created: "2024-01-08T09:00:00Z",
      updated: "2024-01-08T09:00:00Z",
      section: "waiting-for",
      priority: "high",
      waitingFor: "client",
      context: "@waiting"
    },
    {
      id: "task-4",
      title: "Mobile App Development",
      outcome: "Build React Native app for task management",
      intensity: 3,
      tags: ["development", "mobile"],
      dueDate: "2024-03-01",
      estimatedTime: 2400,
      created: "2024-01-01T08:00:00Z",
      updated: "2024-01-01T08:00:00Z",
      section: "projects",
      priority: "high",
      started: true
    },
    {
      id: "task-5",
      title: "Learn Spanish",
      outcome: "Complete beginner Spanish course",
      intensity: 2,
      tags: ["learning", "personal"],
      dueDate: null,
      estimatedTime: 6000,
      created: "2024-01-01T12:00:00Z",
      updated: "2024-01-01T12:00:00Z",
      section: "someday-maybe",
      priority: "low",
      context: "@anywhere"
    },
    {
      id: "task-6",
      title: "Important client contact info",
      outcome: "Key stakeholder details for ABC Corp project",
      intensity: 0,
      tags: ["reference", "contacts"],
      dueDate: null,
      estimatedTime: 0,
      created: "2024-01-01T14:00:00Z",
      updated: "2024-01-01T14:00:00Z",
      section: "reference",
      priority: "none",
      context: "@reference"
    },
    {
      id: "task-7",
      title: "Prepare presentation slides",
      outcome: "Create slides for monthly team meeting",
      intensity: 3,
      tags: ["work", "presentation"],
      dueDate: "2024-01-16",
      estimatedTime: 90,
      created: "2024-01-02T09:00:00Z",
      updated: "2024-01-02T09:00:00Z",
      section: "next-actions",
      priority: "high",
      context: "@computer"
    },
    {
      id: "task-8",
      title: "Buy groceries",
      outcome: "Weekly grocery shopping - check list in notes app",
      intensity: 2,
      tags: ["errands", "personal"],
      dueDate: "2024-01-11",
      estimatedTime: 45,
      created: "2024-01-03T16:00:00Z",
      updated: "2024-01-03T16:00:00Z",
      section: "next-actions",
      context: "@errands"
    },
    {
      id: "task-9",
      title: "Website Redesign Project",
      outcome: "Complete overhaul of company website",
      intensity: 3,
      tags: ["web", "design", "work"],
      dueDate: "2024-02-15",
      estimatedTime: 1800,
      created: "2024-01-01T10:30:00Z",
      updated: "2024-01-01T10:30:00Z",
      section: "projects",
      priority: "high",
      started: true
    },
    {
      id: "task-10",
      title: "Tax documents from accountant",
      outcome: "Waiting for final tax preparation documents",
      intensity: 0,
      tags: ["finance", "taxes"],
      dueDate: "2024-01-31",
      estimatedTime: 0,
      created: "2024-01-05T11:00:00Z",
      updated: "2024-01-05T11:00:00Z",
      section: "waiting-for",
      waitingFor: "accountant",
      priority: "high",
      context: "@waiting"
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

  getTasksBySection(section: string): Task[] {
    return this.data.tasks.filter(task => task.section === section);
  }

  getTaskById(taskId: string): Task | undefined {
    return this.data.tasks.find(task => task.id === taskId);
  }

  addTask(task: Omit<Task, 'id' | 'created' | 'updated'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
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
        updated: new Date().toISOString()
      };
    }
  }

  deleteTask(taskId: string): void {
    this.data.tasks = this.data.tasks.filter(task => task.id !== taskId);
  }

  moveTask(taskId: string, newSection: string): void {
    const taskIndex = this.data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.data.tasks[taskIndex] = {
        ...this.data.tasks[taskIndex],
        section: newSection,
        updated: new Date().toISOString()
      };
    }
  }

  // Search and filter functions
  searchTasks(query: string): Task[] {
    const lowercaseQuery = query.toLowerCase();
    return this.data.tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.outcome.toLowerCase().includes(lowercaseQuery) ||
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
    const completedTasks = this.data.tasks.filter(task => task.started).length;
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
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  }
}

// Create a singleton instance
export const boardStore = new BoardStore();

// Export types for use in components
export type { Task, Column, BoardData, Priority, EnergyLevel }; 