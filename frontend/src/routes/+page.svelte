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
    return Math.floor((hours + minutes / 60) * 120); // 120px per hour
  }

  function scrollToCurrentTime() {
    if (tasksContainer) {
      const position = getCurrentTimePosition();
      tasksContainer.scrollTop = position - tasksContainer.clientHeight / 2;
    }
  }

  function updateCurrentTime() {
    currentTime = new Date();
    // Only update the position if the minute has changed
    if (tasksContainer) {
      const newPosition = getCurrentTimePosition();
      const currentPosition = parseInt(tasksContainer.style.getPropertyValue('--current-time-position') || '0');
      if (newPosition !== currentPosition) {
        tasksContainer.style.setProperty('--current-time-position', newPosition.toString());
      }
    }
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
      // Add visual feedback for the drop target
      const target = event.currentTarget as HTMLElement;
      target.classList.add('bg-blue-50/50');
    }
  }

  function handleDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('bg-blue-50/50');
  }

  function handleDrop(event: DragEvent, targetColumn: string, timeSlot?: string) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('bg-blue-50/50');
    
    if (!draggedTask) return;

    if (targetColumn === 'today' && timeSlot) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const duration = draggedTask.estimatedTime || 60; // Use task's estimated time or default to 1 hour

      // Calculate new start and end times
      const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const endTimeDate = new Date(`2000-01-01T${newStartTime}`);
      endTimeDate.setMinutes(endTimeDate.getMinutes() + duration);
      const newEndTime = endTimeDate.toTimeString().slice(0, 5);

      // If the task is recurring, create a new instance for today
      const isRecurring = recurringTasks.some(rt => rt.id === draggedTask.id.split('-')[0]);
      if (isRecurring) {
        const today = new Date().toISOString().split('T')[0];
        const todayTask = {
          ...draggedTask,
          id: `${draggedTask.id.split('-')[0]}-${today}`,
          section: 'today',
          startTime: newStartTime,
          endTime: newEndTime,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        boardStore.addTask(todayTask);
      } else {
        // For non-recurring tasks, first remove from current section
        const currentSection = draggedTask.section;
        if (currentSection !== 'today') {
          boardStore.updateTask(draggedTask.id, {
            ...draggedTask,
            section: 'today',
            startTime: newStartTime,
            endTime: newEndTime
          });
        } else {
          // If already in today, just update the time
          boardStore.updateTask(draggedTask.id, {
            startTime: newStartTime,
            endTime: newEndTime
          });
        }
      }
    } else {
      // Moving to "Can do now" - remove time information
      const { startTime, endTime, ...taskWithoutTime } = draggedTask;
      boardStore.updateTask(draggedTask.id, {
        ...taskWithoutTime,
        section: 'can-do-now'
      });
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
      outcome: "Reflect on the day and plan tomorrow",
      intensity: 2,
      tags: ["personal", "planning"],
      dueDate: null,
      estimatedTime: 20,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      section: "recurring",
      streak: 3,
      lastCompleted: new Date().toISOString(),
      frequency: "daily"
    },
    {
      id: "recur-3",
      title: "Exercise",
      outcome: "30 minutes workout",
      intensity: 8,
      tags: ["health", "fitness"],
      dueDate: null,
      estimatedTime: 30,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      section: "recurring",
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

    // Add recurring tasks to Today's view
    const existingTasks = boardStore.getTasksBySection('today');
    const today = new Date().toISOString().split('T')[0];
    
    recurringTasks.forEach(task => {
      // Check if the task already exists in Today's view with today's date
      const existingTask = existingTasks.find(t => 
        t.id.startsWith(task.id) && t.id.includes(today)
      );
      
      if (!existingTask) {
        // Find available time slots
        const availableSlots = findAvailableTimeSlots(existingTasks, task.estimatedTime);
        if (availableSlots.length > 0) {
          // Get a random available time slot
          const startTime = getRandomTimeSlot(availableSlots);
          const endTime = new Date(new Date(`2000-01-01T${startTime}`).getTime() + task.estimatedTime * 60 * 1000)
            .toTimeString()
            .slice(0, 5);

          // Create a new task for today
          const todayTask = {
            ...task,
            id: `${task.id}-${today}`, // Unique ID for today's instance
            section: 'today',
            startTime,
            endTime,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          };
          
          // Add the task to today's view
          boardStore.addTask(todayTask);
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
  <style>
    :global(body) {
      background-color: black;
      margin: 0;
      padding: 0;
    }
  </style>
</svelte:head>

{#if activeTask}
  <div class="fixed inset-0 bg-gray-900 z-50 flex flex-col">
    <div class="p-4 border-b border-gray-700 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-white">Zen Mode</h1>
      <button
        onclick={exitZenMode}
        class="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors duration-200"
      >
        ✕
      </button>
    </div>

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-white mb-4">{activeTask.title}</h2>
        
        {#if activeTask.outcome}
          <p class="text-gray-300 mb-6">{activeTask.outcome}</p>
        {/if}

        <div class="grid grid-cols-2 gap-6">
          <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-400 mb-2">Intensity</h3>
            <p class="text-white">{activeTask.intensity}/10</p>
          </div>

          {#if activeTask.estimatedTime}
            <div class="bg-gray-800 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-400 mb-2">Estimated Time</h3>
              <p class="text-white">{activeTask.estimatedTime} minutes</p>
            </div>
          {/if}

          {#if activeTask.tags?.length}
            <div class="bg-gray-800 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-400 mb-2">Tags</h3>
              <div class="flex flex-wrap gap-2">
                {#each activeTask.tags as tag}
                  <span class="px-2 py-1 bg-gray-700 text-gray-200 rounded-full text-sm">
                    {tag}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          {#if activeTask.waitingFor}
            <div class="bg-gray-800 rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-400 mb-2">Waiting For</h3>
              <p class="text-white">{activeTask.waitingFor}</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="h-[100vh] grid grid-rows-[auto_1fr] gap-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
    <!-- Row 1 -->
    <div class="grid grid-cols-[1fr_4fr] gap-4">
      <div class="bg-gray-800 rounded-lg shadow-lg p-4 flex items-center justify-center text-xl font-bold text-white border border-gray-700">
        🧠 Life Manager
      </div>
      <div class="bg-gray-800 rounded-lg shadow-lg p-4 flex items-center justify-center text-xl font-bold text-white border border-gray-700">
        📥 Inbox
      </div>
    </div>

    <!-- Row 2 -->
    <div class="grid grid-cols-[1fr_2fr_1fr] gap-4 min-h-0">
      <!-- Left Column: Can do now + Recurring Tasks -->
      <div class="flex flex-col gap-4 min-h-0">
        <!-- Can do now -->
        <div class="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(50%-0.5rem)] overflow-hidden border border-gray-700">
          <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-white text-lg">Can do now</h2>
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
                class="backdrop-blur-sm bg-gray-700/60 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-gray-600/50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-gray-500/70 {recurringTasks.some(rt => rt.id === task.id) ? 'bg-yellow-900/30' : 'bg-gray-700/60'}"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-white text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.intensity >= 8
                        ? "bg-red-900/70 text-red-200 border border-red-800/50"
                        : task.intensity >= 5
                          ? "bg-yellow-900/70 text-yellow-200 border border-yellow-800/50"
                          : "bg-green-900/70 text-green-200 border border-green-800/50"
                    }`}>
                      Intensity: {task.intensity}
                    </span>
                  </div>

                  {#if task.outcome}
                    <p class="text-xs text-gray-300 mb-2 line-clamp-2">
                      {task.outcome}
                    </p>
                  {/if}

                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <div class="flex flex-wrap gap-1">
                      {#each task.tags as tag}
                        <span class="bg-gray-600/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono text-gray-200">
                          {tag}
                        </span>
                      {/each}
                    </div>
                    {#if task.estimatedTime}
                      <span class="text-gray-400">
                        {task.estimatedTime} min
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}

            {#if boardStore.getTasksBySection('can-do-now').length === 0}
              <div class="flex items-center justify-center text-gray-500 h-full">
                <div class="text-center">
                  <div class="text-2xl mb-2">✨</div>
                  <p class="text-sm">No tasks in can do now</p>
                  <button
                    onclick={() => openTaskModal('can-do-now')}
                    class="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    Add your first task
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Recurring Tasks -->
        <div class="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(50%-0.5rem)] overflow-hidden border border-gray-700">
          <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-white text-lg">Recurring Tasks</h2>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each recurringTasks as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-gray-700/60 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-gray-600/50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-gray-500/70 {recurringTasks.some(rt => rt.id === task.id) ? 'bg-yellow-900/30' : 'bg-gray-700/60'}"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-white text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
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
                        task.intensity >= 8
                          ? "bg-red-900/70 text-red-200 border border-red-800/50"
                          : task.intensity >= 5
                            ? "bg-yellow-900/70 text-yellow-200 border border-yellow-800/50"
                            : "bg-green-900/70 text-green-200 border border-green-800/50"
                      }`}>
                        {task.intensity}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <div class="flex flex-wrap gap-1">
                      {#each task.tags as tag}
                        <span class="bg-gray-600/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono text-gray-200">
                          {tag}
                        </span>
                      {/each}
                    </div>
                    <span class="text-gray-400">
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
      <div class="bg-gradient-to-br from-gray-800 via-blue-900/30 to-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden border border-gray-700">
        <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 via-blue-900/30 to-gray-700 shrink-0">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold text-white text-lg">Today's Schedule</h2>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="grid grid-cols-[100px_1fr] h-[2880px] min-h-0 relative">
            <!-- Time slots -->
            <div class="border-r border-gray-700 h-full overflow-y-auto min-h-0 sticky left-0 bg-gray-800 z-20">
              {#each timeSlots as timeSlot}
                <div class="h-30 border-b border-gray-700 flex items-center justify-center">
                  <span class="text-sm text-gray-400">{timeSlot}</span>
                </div>
              {/each}
            </div>

            <!-- Tasks -->
            <div 
              class="relative h-full overflow-y-auto min-h-0"
              bind:this={tasksContainer}
            >
              <!-- Grid lines -->
              <div class="absolute inset-0 grid grid-rows-[repeat(24,120px)] pointer-events-none">
                {#each timeSlots as timeSlot}
                  <div class="border-b border-gray-700"></div>
                {/each}
              </div>

              <!-- Now indicator line -->
              <div 
                class="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                style="top: {getCurrentTimePosition()}px;"
              >
                <div class="absolute -left-2 -top-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Now
                </div>
              </div>

              <!-- Drop zones -->
              {#each timeSlots as timeSlot}
                <div 
                  class="h-30 border-b border-gray-700 transition-colors duration-200"
                  ondragover={(e) => handleDragOver(e, 'today', timeSlot)}
                  ondragleave={handleDragLeave}
                  ondrop={(e) => handleDrop(e, 'today', timeSlot)}
                  ondragend={handleDragEnd}
                ></div>
              {/each}

              <!-- Tasks -->
              {#each boardStore.getTasksBySection('today') as task}
                {@const startHour = parseInt(task.startTime?.split(':')[0] || '0')}
                {@const startMinute = parseInt(task.startTime?.split(':')[1] || '0')}
                {@const endHour = parseInt(task.endTime?.split(':')[0] || '0')}
                {@const endMinute = parseInt(task.endTime?.split(':')[1] || '0')}
                {@const duration = (endHour - startHour) + (endMinute - startMinute) / 60}
                {@const top = (startHour + startMinute / 60) * 120}
                {@const height = Math.max(duration * 120, 60)}
                {@const isCompact = height < 80}

                <div
                  draggable="true"
                  ondragstart={(e) => handleDragStart(e, task)}
                  onclick={() => handleTaskClick(task)}
                  class="absolute left-2 right-2 backdrop-blur-sm rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-gray-600/50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-gray-500/70 z-10 {recurringTasks.some(rt => rt.id === task.id.split('-')[0]) ? 'bg-yellow-900/30' : 'bg-gray-700/60'}"
                  style="top: {top}px; height: {height}px;"
                >
                  <div class="p-3 {isCompact ? 'py-1' : ''} h-full flex flex-col">
                    <div class="flex items-start justify-between {isCompact ? 'mb-0' : 'mb-1'}">
                      <h3 class="font-medium text-white text-sm leading-tight flex-1 mr-2 truncate flex items-center gap-2">
                        {#if task.started}
                          <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        {/if}
                        {task.title}
                      </h3>
                      {#if !isCompact}
                        <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          task.intensity >= 8
                            ? "bg-red-900/70 text-red-200 border border-red-800/50"
                            : task.intensity >= 5
                              ? "bg-yellow-900/70 text-yellow-200 border border-yellow-800/50"
                              : "bg-green-900/70 text-green-200 border border-green-800/50"
                        }`}>
                          Intensity: {task.intensity}
                        </span>
                      {/if}
                    </div>

                    {#if !isCompact}
                      <div class="flex-1 flex flex-col justify-between">
                        {#if task.outcome}
                          <p class="text-xs text-gray-300 line-clamp-2">
                            {task.outcome}
                          </p>
                        {/if}
                        <div class="flex items-center justify-between text-xs text-gray-400 mt-auto">
                          <div class="flex flex-wrap gap-1">
                            {#each task.tags as tag}
                              <span class="bg-gray-600/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono text-gray-200">
                                {tag}
                              </span>
                            {/each}
                          </div>
                          <span class="text-gray-400">
                            {task.estimatedTime} min
                          </span>
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}

              {#if boardStore.getTasksBySection('today').length === 0}
                <div class="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div class="text-center">
                    <div class="text-2xl mb-2">✨</div>
                    <p class="text-sm">No tasks for today</p>
                    <button
                      onclick={() => openTaskModal('today')}
                      class="text-xs text-blue-400 hover:text-blue-300 mt-1"
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
        <div class="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(33.333%-0.67rem)] overflow-hidden border border-gray-700">
          <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-white text-lg">Waiting For</h2>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each boardStore.getTasksBySection('waiting') as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-gray-700/60 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-gray-600/50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-gray-500/70 {recurringTasks.some(rt => rt.id === task.id) ? 'bg-yellow-900/30' : 'bg-gray-700/60'}"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-white text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.intensity >= 8
                        ? "bg-red-900/70 text-red-200 border border-red-800/50"
                        : task.intensity >= 5
                          ? "bg-yellow-900/70 text-yellow-200 border border-yellow-800/50"
                          : "bg-green-900/70 text-green-200 border border-green-800/50"
                    }`}>
                      Intensity: {task.intensity}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <div class="flex flex-wrap gap-1">
                      {#each task.tags as tag}
                        <span class="bg-gray-600/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono text-gray-200">
                          {tag}
                        </span>
                      {/each}
                    </div>
                    {#if task.waitingFor}
                      <span class="text-gray-400">
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
        <div class="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(33.333%-0.67rem)] overflow-hidden border border-gray-700">
          <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-white text-lg">Someday</h2>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each boardStore.getTasksBySection('someday') as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-gray-700/60 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-gray-600/50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-gray-500/70 {recurringTasks.some(rt => rt.id === task.id) ? 'bg-yellow-900/30' : 'bg-gray-700/60'}"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-white text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.intensity >= 8
                        ? "bg-red-900/70 text-red-200 border border-red-800/50"
                        : task.intensity >= 5
                          ? "bg-yellow-900/70 text-yellow-200 border border-yellow-800/50"
                          : "bg-green-900/70 text-green-200 border border-green-800/50"
                    }`}>
                      Intensity: {task.intensity}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <div class="flex flex-wrap gap-1">
                      {#each task.tags as tag}
                        <span class="bg-gray-600/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono text-gray-200">
                          {tag}
                        </span>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Reference -->
        <div class="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(33.333%-0.67rem)] overflow-hidden border border-gray-700">
          <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-semibold text-white text-lg">Reference</h2>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#each boardStore.getTasksBySection('reference') as task}
              <div
                onclick={() => handleTaskClick(task)}
                class="backdrop-blur-sm bg-gray-700/60 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-gray-600/50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-gray-500/70 {recurringTasks.some(rt => rt.id === task.id) ? 'bg-yellow-900/30' : 'bg-gray-700/60'}"
              >
                <div class="p-3">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-white text-sm leading-tight flex-1 mr-2 flex items-center gap-2">
                      {#if task.started}
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      {/if}
                      {task.title}
                    </h3>
                    <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      task.intensity >= 8
                        ? "bg-red-900/70 text-red-200 border border-red-800/50"
                        : task.intensity >= 5
                          ? "bg-yellow-900/70 text-yellow-200 border border-yellow-800/50"
                          : "bg-green-900/70 text-green-200 border border-green-800/50"
                    }`}>
                      Intensity: {task.intensity}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <div class="flex flex-wrap gap-1">
                      {#each task.tags as tag}
                        <span class="bg-gray-600/50 backdrop-blur-sm px-2 py-1 rounded-md font-mono text-gray-200">
                          {tag}
                        </span>
                      {/each}
                    </div>
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
