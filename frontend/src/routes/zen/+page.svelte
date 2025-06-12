<script lang="ts">
  import { onMount } from "svelte";
  
  // Sample task for zen mode
  const zenTask = {
    id: "1",
    title: "Review Project Proposal",
    description: "Go through the new client proposal and prepare feedback. Focus on the technical requirements and implementation timeline. Consider potential challenges and resource needs.",
    priority: "high",
    context: "Work",
    estimatedTime: 60,
    tags: ["review", "documentation"]
  };

  let elapsedTime = $state(0);
  let timerInterval: number;
  let isTimerRunning = $state(true);

  onMount(() => {
    startTimer();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  });

  function startTimer() {
    timerInterval = setInterval(() => {
      elapsedTime++;
    }, 1000);
  }

  function toggleTimer() {
    if (isTimerRunning) {
      clearInterval(timerInterval);
    } else {
      startTimer();
    }
    isTimerRunning = !isTimerRunning;
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- Timer Section -->
  <div class="fixed top-4 right-4 z-50">
    <div class="bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/20 p-4">
      <div class="flex items-center gap-4">
        <span class="text-2xl font-mono tabular-nums">{formatTime(elapsedTime)}</span>
        <button
          onclick={toggleTimer}
          class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors duration-200"
          title={isTimerRunning ? "Pause timer" : "Start timer"}
        >
          {isTimerRunning ? "⏸️" : "▶️"}
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto">
    <div class="w-full space-y-12">
      <!-- Task Title -->
      <div class="text-center">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          {zenTask.title}
        </h1>
        <div class="mt-4 flex items-center justify-center gap-3">
          <span class={`text-sm px-3 py-1 rounded-full font-medium ${
            zenTask.priority === "high"
              ? "bg-red-100 text-red-800 border border-red-200"
              : zenTask.priority === "medium"
                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                : "bg-green-100 text-green-800 border border-green-200"
          }`}>
            {zenTask.priority}
          </span>
          <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {zenTask.estimatedTime} minutes
          </span>
        </div>
      </div>

      <!-- Task Description -->
      <div class="prose prose-lg max-w-none text-center">
        <p class="text-xl md:text-2xl text-gray-600 leading-relaxed">
          {zenTask.description}
        </p>
      </div>

      <!-- Context and Tags -->
      <div class="flex flex-wrap justify-center gap-3">
        <span class="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-full">
          {zenTask.context}
        </span>
        {#each zenTask.tags as tag}
          <span class="text-sm bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            #{tag}
          </span>
        {/each}
      </div>
    </div>
  </main>

  <!-- Navigation -->
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
    <div class="bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/20 p-2">
      <div class="flex gap-2">
        <button
          class="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          title="Previous task"
        >
          ←
        </button>
        <button
          class="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          title="Next task"
        >
          →
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add smooth transitions for all interactive elements */
  button {
    transition: all 0.2s ease-in-out;
  }
  
  /* Ensure proper spacing for the main content */
  main {
    min-height: calc(100vh - 2rem);
  }
</style>
