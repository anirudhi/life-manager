<script lang="ts">
  import { boardStore } from "$lib/stores/boardStore.svelte";
  import type { Task } from "$lib/stores/boardStore.svelte";
  import Column from "$lib/components/Column.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TaskModal from "$lib/components/TaskModal.svelte";
  import { onMount } from "svelte";

  let showTaskModal = $state(false);
  let selectedColumnId = $state("");
  let searchQuery = $state("");
  let draggedTask = $state<Task | null>(null);
  let draggedOverTime = $state<string | null>(null);
  let currentTime = $state(new Date());
  let activeTask = $state<Task | null>(null);
  let tasksContainer: HTMLElement;

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  function getCurrentTimePosition() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours + minutes / 60) * 120; // 120px per hour
  }

  function scrollToCurrentTime() {
    if (tasksContainer) {
      const position = getCurrentTimePosition();
      tasksContainer.scrollTop = position - tasksContainer.clientHeight / 2;
    }
  }

  function updateCurrentTime() {
    currentTime = new Date();
  }

  function handleDragStart(event: DragEvent, task: Task) {
    draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent, targetColumn: string, timeSlot?: string) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (timeSlot) {
      draggedOverTime = timeSlot;
    }
  }

  function handleDrop(event: DragEvent, targetColumn: string, timeSlot?: string) {
    event.preventDefault();
    if (draggedTask) {
      if (targetColumn === 'today' && timeSlot) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const duration = 1; // Default 1 hour duration for tasks moved to today

        const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const newEndTime = new Date(new Date(`2000-01-01T${newStartTime}`).getTime() + duration * 60 * 60 * 1000)
          .toTimeString()
          .slice(0, 5);

        boardStore.updateTask(draggedTask.id, {
          ...draggedTask,
          section: 'today',
          startTime: newStartTime,
          endTime: newEndTime
        });
      } else {
        // Moving to "Can do now" - remove time information
        const { startTime, endTime, ...taskWithoutTime } = draggedTask;
        boardStore.updateTask(draggedTask.id, {
          ...taskWithoutTime,
          section: 'can-do-now'
        });
      }
    }
    draggedTask = null;
    draggedOverTime = null;
  }

  function handleDragEnd() {
    draggedTask = null;
    draggedOverTime = null;
  }

  function openTaskModal(columnId: string) {
    selectedColumnId = columnId;
    showTaskModal = true;
  }

  function closeTaskModal() {
    showTaskModal = false;
    selectedColumnId = "";
  }

  function handleTaskCreate(taskData: any) {
    boardStore.addTask({
      ...taskData,
      section: selectedColumnId,
    });
    closeTaskModal();
  }

  function handleTaskClick(task: Task) {
    // Toggle started state
    boardStore.updateTask(task.id, {
      ...task,
      started: !task.started
    });
    activeTask = task;
  }

  function exitZenMode() {
    activeTask = null;
  }

  interface RecurringTask extends Task {
    streak: number;
    lastCompleted: string | null;
    frequency: 'daily' | 'weekly' | 'monthly';
  }

  let recurringTasks = $state<RecurringTask[]>([
    {
      id: "recur-1",
      title: "Morning Meditation",
      outcome: "Complete 15 minutes of mindfulness practice",
      intensity: 1,
      tags: ["health", "wellness"],
      dueDate: null,
      estimatedTime: 15,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      section: "recurring",
      streak: 7,
      lastCompleted: new Date().toISOString(),
      frequency: "daily"
    },
    {
      id: "recur-2",
      title: "Evening Journal",
      description: "Reflect on the day and plan tomorrow",
      section: "recurring",
      priority: "medium" as const,
      tags: ["personal", "planning"],
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTime: 20,
      context: "@home",
      energy: "low" as const,
      streak: 3,
      lastCompleted: new Date().toISOString(),
      frequency: "daily"
    },
    {
      id: "recur-3",
      title: "Exercise",
      description: "30 minutes workout",
      section: "recurring",
      priority: "high" as const,
      tags: ["health", "fitness"],
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTime: 30,
      context: "@home",
      energy: "high" as const,
      streak: 5,
      lastCompleted: new Date().toISOString(),
      frequency: "daily"
    }
  ]);

  function getStreakColor(streak: number): string {
    if (streak >= 7) return "bg-green-100 text-green-800 border-green-200";
    if (streak >= 3) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  }

  function getStreakEmoji(streak: number): string {
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "⭐";
    return "✨";
  }

  function findAvailableTimeSlots(existingTasks: Task[], taskDuration: number): string[] {
    const busySlots = new Set<string>();
    
    // Mark all busy time slots
    existingTasks.forEach(task => {
      if (task.startTime && task.endTime) {
        const start = new Date(`2000-01-01T${task.startTime}`).getTime();
        const end = new Date(`2000-01-01T${task.endTime}`).getTime();
        for (let time = start; time < end; time += 30 * 60 * 1000) { // Check every 30 minutes
          busySlots.add(new Date(time).toTimeString().slice(0, 5));
        }
      }
    });

    // Find available slots
    const availableSlots: string[] = [];
    for (let hour = 8; hour < 18; hour++) { // Look between 8 AM and 6 PM
      for (let minute = 0; minute < 60; minute += 30) { // Check every 30 minutes
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        let isSlotAvailable = true;
        
        // Check if this slot and the next slots for the task duration are free
        for (let i = 0; i < taskDuration; i += 30) {
          const checkTime = new Date(`2000-01-01T${timeSlot}`).getTime() + i * 60 * 1000;
          const checkSlot = new Date(checkTime).toTimeString().slice(0, 5);
          if (busySlots.has(checkSlot)) {
            isSlotAvailable = false;
            break;
          }
        }
        
        if (isSlotAvailable) {
          availableSlots.push(timeSlot);
        }
      }
    }
    
    return availableSlots;
  }

  function getRandomTimeSlot(availableSlots: string[]): string {
    return availableSlots[Math.floor(Math.random() * availableSlots.length)];
  }

  onMount(() => {
    scrollToCurrentTime();
    // Update current time every minute
    const interval = setInterval(updateCurrentTime, 60000);

    // Add sample tasks to "Can do now"
    const sampleTasks = [
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
      }
    ];

    // Only add tasks if the column is empty
    if (boardStore.getTasksBySection('can-do-now').length === 0) {
      sampleTasks.forEach(task => boardStore.addTask(task));
    }

    // Add sample waiting tasks
    const waitingTasks = [
      {
        id: "wait-1",
        title: "Client Feedback on Proposal",
        outcome: "Get client's approval on project proposal",
        intensity: 3,
        tags: ["client", "feedback"],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        section: "waiting"
      }
    ];

    // Add sample someday tasks
    const somedayTasks = [
      {
        id: "someday-1",
        title: "Learn Rust Programming",
        outcome: "Complete Rust fundamentals course and build a small project",
        intensity: 2,
        tags: ["learning", "programming"],
        dueDate: null,
        estimatedTime: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        section: "someday"
      }
    ];

    // Add sample reference tasks
    const referenceTasks = [
      {
        id: "ref-1",
        title: "Project Architecture Notes",
        outcome: "Maintain up-to-date documentation of system architecture",
        intensity: 1,
        tags: ["documentation", "architecture"],
        dueDate: null,
        estimatedTime: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        section: "reference"
      }
    ];

    // Add tasks if columns are empty
    if (boardStore.getTasksBySection('waiting').length === 0) {
      waitingTasks.forEach(task => boardStore.addTask(task));
    }
    if (boardStore.getTasksBySection('someday').length === 0) {
      somedayTasks.forEach(task => boardStore.addTask(task));
    }
    if (boardStore.getTasksBySection('reference').length === 0) {
      referenceTasks.forEach(task => boardStore.addTask(task));
    }

    // Add recurring tasks to Today's view
    const existingTasks = boardStore.getTasksBySection('today');
    recurringTasks.forEach(task => {
      // Check if the task already exists in Today's view by comparing IDs
      const existingTask = existingTasks.find(t => t.id === task.id);
      if (!existingTask) {
        // Find available time slots
        const availableSlots = findAvailableTimeSlots(existingTasks, task.estimatedTime);
        if (availableSlots.length > 0) {
          // Get a random available time slot
          const startTime = getRandomTimeSlot(availableSlots);
          const endTime = new Date(new Date(`2000-01-01T${startTime}`).getTime() + task.estimatedTime * 60 * 1000)
            .toTimeString()
            .slice(0, 5);

          // Add to Today with the found time slot, preserving the original task ID
          const todayTask = {
            ...task,
            section: 'today',
            startTime,
            endTime
          };
          
          // Use updateTask instead of addTask to preserve the ID
          boardStore.updateTask(task.id, todayTask);
        }
      }
    });

    return () => clearInterval(interval);
  });

  $effect(() => {
    // Update current time position when it changes
    if (tasksContainer) {
      scrollToCurrentTime();
    }
  });
</script>

<svelte:head>
  <title>GTD Life Manager</title>
  <meta name="description" content="Getting Things Done with style" />
</svelte:head>

{#if activeTask}
  <div class="fixed inset-0 bg-white z-50 flex flex-col">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-900">Zen Mode</h1>
      <button
        onclick={exitZenMode}
        class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors duration-200"
      >
        ✕
      </button>
    </div>

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">{activeTask.title}</h2>
        
        {#if activeTask.description}
          <p class="text-gray-600 mb-6">{activeTask.description}</p>
        {/if}

        <div class="grid grid-cols-2 gap-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Context</h3>
            <p class="text-gray-900">{activeTask.context}</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Priority</h3>
            <p class="text-gray-900 capitalize">{activeTask.priority}</p>
          </div>

          {#if activeTask.estimatedTime}
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Estimated Time</h3>
              <p class="text-gray-900">{activeTask.estimatedTime} minutes</p>
            </div>
          {/if}

          {#if activeTask.tags?.length}
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div class="flex flex-wrap gap-2">
                {#each activeTask.tags as tag}
                  <span class="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="h-[100vh] grid grid-rows-[auto_1fr] gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
    <!-- Row 1 -->
    <div class="grid grid-cols-[1fr_4fr] gap-4">
      <div class="bg-white rounded-lg shadow p-4 flex items-center justify-center text-xl font-bold">
        🧠 Life Manager
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex items-center justify-center text-xl font-bold">
        📥 Inbox
      </div>
    </div>

    <!-- Row 2 -->
    <div class="grid grid-cols-[1fr_2fr_1fr] gap-4 min-h-0">
      <!-- Left Column: Can do now + Recurring Tasks -->
      <div class="flex flex-col gap-4 min-h-0">
        <!-- Can do now -->
        <div class="bg-white rounded-lg shadow flex flex-col h-[calc(50%-0.5rem)] overflow-hidden">
          <div class="p-4 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-gray-900 text-lg">Can do now</h2>
              <button
                onclick={() => openTaskModal('can-do-now')}
                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xl flex items-center justify-center transition-colors duration-200"
                title="Add task"
              >
                +
              </button>
            </div>
          </div>

          <div 
            class="flex-1 overflow-y-auto p-4 space-y-3"
            ondragover={(e) => handleDragOver(e, 'can-do-now')}
            ondrop={(e) => handleDrop(e, 'can-do-now')}
            ondragend={handleDragEnd}
          >
            {#each boardStore.getTasksBySection('can-do-now') as task}
              <div
                draggable="true"
                ondragstart={(e) => handleDragStart(e, task)}
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-white/60 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/50 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-white/70"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap backdrop-blur-sm ${
                      task.priority === "high"
                        ? "bg-red-100/70 text-red-800 border border-red-200/50"
                        : task.priority === "medium"
                          ? "bg-yellow-100/70 text-yellow-800 border border-yellow-200/50"
                          : "bg-green-100/70 text-green-800 border border-green-200/50"
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono">
                      {task.context}
                    </span>
                  </div>
                </div>
              </div>
            {/each}

            {#if boardStore.getTasksBySection('can-do-now').length === 0}
              <div class="flex items-center justify-center text-gray-400 h-full">
                <div class="text-center">
                  <div class="text-2xl mb-2">✨</div>
                  <p class="text-sm">No tasks in can do now</p>
                  <button
                    onclick={() => openTaskModal('can-do-now')}
                    class="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Add your first task
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Recurring Tasks -->
        <div class="bg-white rounded-lg shadow flex flex-col h-[calc(50%-0.5rem)] overflow-hidden">
          <div class="p-4 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-gray-900 text-lg">Recurring Tasks</h2>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each recurringTasks as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-white/60 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/50 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-white/70"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <div class="flex items-center space-x-2">
                      <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${getStreakColor(task.streak)}`}>
                        {getStreakEmoji(task.streak)} {task.streak} days
                      </span>
                      <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        task.priority === "high"
                          ? "bg-red-100/70 text-red-800 border border-red-200/50"
                          : task.priority === "medium"
                            ? "bg-yellow-100/70 text-yellow-800 border border-yellow-200/50"
                            : "bg-green-100/70 text-green-800 border border-green-200/50"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono">
                      {task.context}
                    </span>
                    <span class="text-gray-500">
                      {task.estimatedTime} min
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Middle Column: Today's Schedule -->
      <div class="bg-white rounded-lg shadow flex flex-col overflow-hidden">
        <div class="p-4 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 shrink-0">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold text-gray-900 text-lg">Today's Schedule</h2>
            <button
              onclick={() => openTaskModal('today')}
              class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xl flex items-center justify-center transition-colors duration-200"
              title="Add task"
            >
              +
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="grid grid-cols-[100px_1fr] h-[2880px] min-h-0">
            <!-- Time slots -->
            <div class="border-r border-gray-200 h-full overflow-y-auto min-h-0">
              {#each timeSlots as timeSlot}
                <div class="h-30 border-b border-gray-100 flex items-center justify-center">
                  <span class="text-sm text-gray-500">{timeSlot}</span>
                </div>
              {/each}
            </div>

            <!-- Tasks -->
            <div 
              class="relative h-full overflow-y-auto min-h-0"
              bind:this={tasksContainer}
            >
              <!-- Now indicator line -->
              <div 
                class="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                style="top: {getCurrentTimePosition()}px;"
              >
                <div class="absolute -left-2 -top-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Now
                </div>
              </div>

              {#each timeSlots as timeSlot}
                <div 
                  class="h-30 border-b border-gray-100"
                  ondragover={(e) => handleDragOver(e, 'today', timeSlot)}
                  ondrop={(e) => handleDrop(e, 'today', timeSlot)}
                  ondragend={handleDragEnd}
                ></div>
              {/each}

              {#each boardStore.getTasksBySection('today') as task}
                {@const startHour = parseInt(task.startTime?.split(':')[0] || '0')}
                {@const startMinute = parseInt(task.startTime?.split(':')[1] || '0')}
                {@const endHour = parseInt(task.endTime?.split(':')[0] || '0')}
                {@const endMinute = parseInt(task.endTime?.split(':')[1] || '0')}
                {@const duration = (endHour - startHour) + (endMinute - startMinute) / 60}
                {@const top = (startHour + startMinute / 60) * 120}
                {@const height = duration * 120}
                {@const isRecurring = recurringTasks.some(rt => rt.id === task.id)}
                {@const isCompact = height < 80}

                <div
                  draggable="true"
                  ondragstart={(e) => handleDragStart(e, task)}
                  onclick={() => handleTaskClick(task)}
                  class="backdrop-blur-sm bg-white/60 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/50 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-white/70"
                  style="top: {top}px; height: {height}px;"
                >
                  <div class="p-3 {isCompact ? 'py-1' : ''}">
                    <div class="flex items-start justify-between {isCompact ? 'mb-0' : 'mb-1'}">
                      <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2 truncate flex items-center gap-2">
                        {#if task.started}
                          <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        {/if}
                        {task.title}
                        {#if isRecurring}
                          <span class="inline-block ml-1 text-xs text-blue-600">🔄</span>
                        {/if}
                      </h3>
                      {#if !isCompact}
                        <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          task.priority === "high"
                            ? "bg-red-100/70 text-red-800 border border-red-200/50"
                            : task.priority === "medium"
                              ? "bg-yellow-100/70 text-yellow-800 border border-yellow-200/50"
                              : "bg-green-100/70 text-green-800 border border-green-200/50"
                        }`}>
                          {task.priority}
                        </span>
                      {/if}
                    </div>

                    {#if !isCompact}
                      <div class="flex items-center justify-between text-xs text-gray-500">
                        <span class="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono">
                          {task.context}
                        </span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}

              {#if boardStore.getTasksBySection('today').length === 0}
                <div class="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div class="text-center">
                    <div class="text-2xl mb-2">✨</div>
                    <p class="text-sm">No tasks for today</p>
                    <button
                      onclick={() => openTaskModal('today')}
                      class="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Add your first task
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Waiting + Someday + Reference -->
      <div class="flex flex-col gap-4 min-h-0">
        <!-- Waiting For -->
        <div class="bg-white rounded-lg shadow flex flex-col h-[calc(33.333%-0.67rem)] overflow-hidden">
          <div class="p-4 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-gray-900 text-lg">Waiting For</h2>
              <button
                onclick={() => openTaskModal('waiting')}
                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xl flex items-center justify-center transition-colors duration-200"
                title="Add task"
              >
                +
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each boardStore.getTasksBySection('waiting') as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-white/60 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/50 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-white/70"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.priority === "high"
                        ? "bg-red-100/70 text-red-800 border border-red-200/50"
                        : task.priority === "medium"
                          ? "bg-yellow-100/70 text-yellow-800 border border-yellow-200/50"
                          : "bg-green-100/70 text-green-800 border border-green-200/50"
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono">
                      {task.context}
                    </span>
                    {#if task.waitingFor}
                      <span class="text-gray-500">
                        Waiting for: {task.waitingFor}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Someday -->
        <div class="bg-white rounded-lg shadow flex flex-col h-[calc(33.333%-0.67rem)] overflow-hidden">
          <div class="p-4 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-gray-900 text-lg">Someday</h2>
              <button
                onclick={() => openTaskModal('someday')}
                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xl flex items-center justify-center transition-colors duration-200"
                title="Add task"
              >
                +
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each boardStore.getTasksBySection('someday') as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-white/60 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/50 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-white/70"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.priority === "high"
                        ? "bg-red-100/70 text-red-800 border border-red-200/50"
                        : task.priority === "medium"
                          ? "bg-yellow-100/70 text-yellow-800 border border-yellow-200/50"
                          : "bg-green-100/70 text-green-800 border border-green-200/50"
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono">
                      {task.context}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Reference -->
        <div class="bg-white rounded-lg shadow flex flex-col h-[calc(33.333%-0.67rem)] overflow-hidden">
          <div class="p-4 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-gray-900 text-lg">Reference</h2>
              <button
                onclick={() => openTaskModal('reference')}
                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xl flex items-center justify-center transition-colors duration-200"
                title="Add task"
              >
                +
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each boardStore.getTasksBySection('reference') as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-white/60 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/50 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-white/70"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.priority === "high"
                        ? "bg-red-100/70 text-red-800 border border-red-200/50"
                        : task.priority === "medium"
                          ? "bg-yellow-100/70 text-yellow-800 border border-yellow-200/50"
                          : "bg-green-100/70 text-green-800 border border-green-200/50"
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span class="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono">
                      {task.context}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showTaskModal}
  <TaskModal
    {selectedColumnId}
    onClose={closeTaskModal}
    onCreate={handleTaskCreate}
  />
{/if}
