<script lang="ts">
  import { onMount } from "svelte";
  
  // Sample tasks for today
  let todayTasks = $state([
    {
      id: "1",
      title: "Morning Standup",
      description: "Daily team sync to discuss progress and blockers",
      priority: "high",
      context: "Work",
      dueDate: new Date().toISOString(),
      tags: ["meeting", "work"],
      estimatedTime: 30,
      startTime: "09:00",
      endTime: "09:30"
    },
    {
      id: "2",
      title: "Review Project Proposal",
      description: "Go through the new client proposal and prepare feedback",
      priority: "medium",
      context: "Work",
      dueDate: new Date().toISOString(),
      tags: ["review", "documentation"],
      estimatedTime: 60,
      startTime: "10:00",
      endTime: "11:00"
    },
    {
      id: "3",
      title: "Lunch Break",
      description: "Take a break and grab some food",
      priority: "low",
      context: "Personal",
      dueDate: new Date().toISOString(),
      tags: ["break"],
      estimatedTime: 45,
      startTime: "12:00",
      endTime: "12:45"
    },
    {
      id: "4",
      title: "Client Call",
      description: "Discuss project timeline with the client",
      priority: "high",
      context: "Work",
      dueDate: new Date().toISOString(),
      tags: ["meeting", "client"],
      estimatedTime: 45,
      startTime: "14:00",
      endTime: "14:45"
    },
    {
      id: "5",
      title: "Evening Exercise",
      description: "30 minutes workout session",
      priority: "medium",
      context: "Health",
      dueDate: new Date().toISOString(),
      tags: ["health", "exercise"],
      estimatedTime: 30,
      startTime: "18:00",
      endTime: "18:30"
    }
  ]);

  let draggedTask = $state(null);
  let draggedOverTime = $state(null);

  // Generate time slots for the day
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Get current date in a nice format
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Handle drag and drop
  function handleDragStart(event: DragEvent, task: any) {
    draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent, timeSlot: string) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    draggedOverTime = timeSlot;
  }

  function handleDrop(event: DragEvent, timeSlot: string) {
    event.preventDefault();
    if (draggedTask && draggedOverTime) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const duration = new Date(`2000-01-01T${draggedTask.endTime}`).getTime() - 
                      new Date(`2000-01-01T${draggedTask.startTime}`).getTime();
      
      const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const newEndTime = new Date(new Date(`2000-01-01T${newStartTime}`).getTime() + duration)
        .toTimeString()
        .slice(0, 5);

      todayTasks = todayTasks.map(task => 
        task.id === draggedTask.id 
          ? { ...task, startTime: newStartTime, endTime: newEndTime }
          : task
      );
    }
    draggedTask = null;
    draggedOverTime = null;
  }

  function handleDragEnd() {
    draggedTask = null;
    draggedOverTime = null;
  }
</script>

<div class="min-h-screen bg-gray-50 p-4 font-sans">
  <header class="mb-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Today's Schedule</h1>
      <p class="text-gray-600">{today}</p>
    </div>
  </header>

  <main class="max-w-4xl mx-auto">
    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div class="grid grid-cols-[100px_1fr]">
        <!-- Time slots column -->
        <div class="border-r border-gray-200">
          {#each timeSlots as timeSlot}
            <div class="h-20 border-b border-gray-100 flex items-center justify-center">
              <span class="text-sm text-gray-500">{timeSlot}</span>
            </div>
          {/each}
        </div>

        <!-- Events column -->
        <div class="relative">
          {#each timeSlots as timeSlot}
            <div 
              class="h-20 border-b border-gray-100"
              ondragover={(e) => handleDragOver(e, timeSlot)}
              ondrop={(e) => handleDrop(e, timeSlot)}
              ondragend={handleDragEnd}
            ></div>
          {/each}

          <!-- Task cards -->
          {#each todayTasks as task}
            {@const startHour = parseInt(task.startTime.split(':')[0])}
            {@const startMinute = parseInt(task.startTime.split(':')[1])}
            {@const endHour = parseInt(task.endTime.split(':')[0])}
            {@const endMinute = parseInt(task.endTime.split(':')[1])}
            {@const duration = (endHour - startHour) + (endMinute - startMinute) / 60}
            {@const top = (startHour + startMinute / 60) * 80} <!-- 80px per hour -->
            {@const height = duration * 80}
            
            <div
              draggable="true"
              ondragstart={(e) => handleDragStart(e, task)}
              class="absolute left-4 right-4 rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md transition-all duration-200 cursor-move hover:scale-[1.02] hover:border-gray-300"
              style="top: {top}px; height: {height}px;"
            >
              <div class="p-3">
                <div class="flex items-start justify-between mb-1">
                  <h3 class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2">
                    {task.title}
                  </h3>
                  <span class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : "bg-green-100 text-green-800 border border-green-200"
                  }`}>
                    {task.priority}
                  </span>
                </div>

                {#if task.description}
                  <p class="text-xs text-gray-600 mb-2 leading-relaxed">
                    {task.description}
                  </p>
                {/if}

                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span class="bg-gray-50 px-2 py-1 rounded-md font-mono">
                    {task.context}
                  </span>
                  <span class="text-gray-500">
                    {task.startTime} - {task.endTime}
                  </span>
                </div>

                {#if task.tags.length > 0}
                  <div class="flex flex-wrap gap-1 mt-2">
                    {#each task.tags as tag}
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md border border-blue-200">
                        #{tag}
                      </span>
                    {/each}
                  </div>
                {/if}

                <div class="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                  <span class="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    🕒 {task.estimatedTime}min
                  </span>
                  <button
                    onclick={() => todayTasks = todayTasks.filter(t => t.id !== task.id)}
                    class="text-red-400 hover:text-red-600 text-sm w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors duration-200"
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </main>
</div>
