<script lang="ts">
  import { boardStore } from "$lib/stores/boardStore.svelte";
  import Column from "$lib/components/Column.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TaskModal from "$lib/components/TaskModal.svelte";
  import { onMount } from "svelte";

  let showTaskModal = $state(false);
  let selectedColumnId = $state("");
  let searchQuery = $state("");
  let draggedTask = $state(null);

  // Handle drag and drop
  function handleDragStart(event: DragEvent, task: any) {
    draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleDrop(event: DragEvent, columnId: string) {
    event.preventDefault();
    if (draggedTask && draggedTask.columnId !== columnId) {
      boardStore.moveTask(draggedTask.id, columnId);
    }
    draggedTask = null;
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
      columnId: selectedColumnId,
    });
    closeTaskModal();
  }

  $effect(() => {
    // Any reactive effects can go here
  });
</script>

<svelte:head>
  <title>GTD Life Manager</title>
  <meta name="description" content="Getting Things Done with style" />
</svelte:head>

<div class="min-h-screen bg-gray-50 p-4 font-sans">
  <header class="mb-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">📋 GTD Life Manager</h1>
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <p class="text-gray-600">
          Organize your life with the Getting Things Done methodology
        </p>
        <div class="flex items-center gap-4">
          <SearchBar bind:value={searchQuery} />
          <div class="text-sm text-gray-500 whitespace-nowrap">
            {boardStore.tasks.length} total tasks
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto">
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
    >
      {#each boardStore.columns as column (column.id)}
        <div class="flex flex-col">
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 min-h-[600px]"
          >
            <div
              class="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white"
            >
              <div class="flex items-center justify-between mb-2">
                <h2 class="font-semibold text-gray-900 text-lg">
                  {column.title}
                </h2>
                <button
                  onclick={() => openTaskModal(column.id)}
                  class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xl flex items-center justify-center transition-colors duration-200"
                  title="Add task"
                >
                  +
                </button>
              </div>
              <p class="text-sm text-gray-500 mb-2">{column.description}</p>
              <div
                class="text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-1 inline-block"
              >
                {boardStore.getTasksByColumn(column.id).length} tasks
              </div>
            </div>

            <div
              class="p-2 space-y-2 min-h-96 overflow-y-auto max-h-[500px]"
              ondragover={handleDragOver}
              ondrop={(e) => handleDrop(e, column.id)}
            >
              {#each boardStore.getTasksByColumn(column.id) as task (task.id)}
                {#if !searchQuery || task.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) || task.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())}
                  <div
                    draggable="true"
                    ondragstart={(e) => handleDragStart(e, task)}
                    class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-move hover:scale-[1.02] hover:border-gray-300"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <h3
                        class="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2"
                      >
                        {task.title}
                      </h3>
                      <span
                        class={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : task.priority === "low"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {#if task.description}
                      <p class="text-xs text-gray-600 mb-3 leading-relaxed">
                        {task.description}
                      </p>
                    {/if}

                    <div
                      class="flex items-center justify-between text-xs text-gray-500 mb-2"
                    >
                      <span class="bg-gray-50 px-2 py-1 rounded-md font-mono"
                        >{task.context}</span
                      >
                      {#if task.dueDate}
                        <span
                          class={`px-2 py-1 rounded-md font-medium ${
                            new Date(task.dueDate) < new Date()
                              ? "text-red-600 bg-red-50 border border-red-200"
                              : "text-gray-600 bg-gray-50"
                          }`}
                        >
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      {/if}
                    </div>

                    {#if task.tags.length > 0}
                      <div class="flex flex-wrap gap-1 mb-2">
                        {#each task.tags as tag}
                          <span
                            class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md border border-blue-200"
                          >
                            #{tag}
                          </span>
                        {/each}
                      </div>
                    {/if}

                    {#if task.subtasks && task.subtasks.length > 0}
                      <div
                        class="mb-2 text-xs text-gray-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200"
                      >
                        📝 {task.subtasks.length} subtasks
                      </div>
                    {/if}

                    {#if task.waitingFor}
                      <div
                        class="mb-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-200"
                      >
                        ⏳ Waiting for: {task.waitingFor}
                      </div>
                    {/if}

                    <div
                      class="flex justify-between items-center pt-2 border-t border-gray-100"
                    >
                      <span
                        class="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md"
                      >
                        🕒 {task.estimatedTime}min
                      </span>
                      <button
                        onclick={() => boardStore.deleteTask(task.id)}
                        class="text-red-400 hover:text-red-600 text-sm w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors duration-200"
                        title="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                {/if}
              {/each}

              <!-- Empty state -->
              {#if boardStore.getTasksByColumn(column.id).length === 0}
                <div class="text-center py-8 text-gray-400">
                  <div class="text-2xl mb-2">✨</div>
                  <p class="text-sm">No tasks yet</p>
                  <button
                    onclick={() => openTaskModal(column.id)}
                    class="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Add the first one
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </main>
</div>

{#if showTaskModal}
  <TaskModal
    {selectedColumnId}
    onClose={closeTaskModal}
    onCreate={handleTaskCreate}
  />
{/if}
