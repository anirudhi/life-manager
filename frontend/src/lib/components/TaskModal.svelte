<script lang="ts">
  interface Props {
    selectedColumnId: string;
    onClose: () => void;
    onCreate: (task: any) => void;
  }

  let { selectedColumnId, onClose, onCreate }: Props = $props();

  let title = $state("");
  let description = $state("");
  let priority = $state("medium");
  let tags = $state("");
  let dueDate = $state("");
  let estimatedTime = $state(30);
  let context = $state("@computer");
  let energy = $state("medium");
  let waitingFor = $state("");
  let subtasks = $state("");

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority: priority as "high" | "medium" | "low" | "none",
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      dueDate: dueDate || null,
      estimatedTime,
      context,
      energy: energy as "high" | "medium" | "low" | "none",
      waitingFor: waitingFor.trim() || undefined,
      subtasks: subtasks
        .split("\n")
        .map((task) => task.trim())
        .filter(Boolean),
    };

    onCreate(taskData);
  }

  function handleBackgroundClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<div
  class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
  onclick={handleBackgroundClick}
>
  <div
    class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-in zoom-in-95 duration-200"
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Add New Task</h2>
          <p class="text-sm text-gray-500 mt-1">
            Create a task for {boardStore.columns.find(
              (c) => c.id === selectedColumnId
            )?.title}
          </p>
        </div>
        <button
          onclick={onClose}
          class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors duration-200"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-5">
        <div>
          <label
            for="title"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Title <span class="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            bind:value={title}
            placeholder="Enter task title..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="Describe the task in detail..."
            rows="3"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              for="priority"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              bind:value={priority}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="high" class="text-red-600">🔴 High</option>
              <option value="medium" class="text-yellow-600">🟡 Medium</option>
              <option value="low" class="text-green-600">🟢 Low</option>
              <option value="none" class="text-gray-600">⚪ None</option>
            </select>
          </div>

          <div>
            <label
              for="energy"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Energy Level
            </label>
            <select
              id="energy"
              bind:value={energy}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="high">⚡ High Energy</option>
              <option value="medium">🔋 Medium Energy</option>
              <option value="low">🪫 Low Energy</option>
              <option value="none">💤 No Energy Required</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              for="context"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Context
            </label>
            <select
              id="context"
              bind:value={context}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono"
            >
              <option value="@computer">💻 @computer</option>
              <option value="@phone">📞 @phone</option>
              <option value="@errands">🚗 @errands</option>
              <option value="@home">🏠 @home</option>
              <option value="@office">🏢 @office</option>
              <option value="@anywhere">🌍 @anywhere</option>
              <option value="@waiting">⏳ @waiting</option>
              <option value="@reference">📚 @reference</option>
            </select>
          </div>

          <div>
            <label
              for="estimatedTime"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Time (minutes)
            </label>
            <input
              id="estimatedTime"
              type="number"
              bind:value={estimatedTime}
              min="0"
              step="5"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              for="dueDate"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              bind:value={dueDate}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label
              for="tags"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Tags
            </label>
            <input
              id="tags"
              type="text"
              bind:value={tags}
              placeholder="work, personal, urgent"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p class="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>
        </div>

        {#if selectedColumnId === "waiting-for"}
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <label
              for="waitingFor"
              class="block text-sm font-medium text-orange-800 mb-2"
            >
              ⏳ Waiting For
            </label>
            <input
              id="waitingFor"
              type="text"
              bind:value={waitingFor}
              placeholder="Person or thing you're waiting for..."
              class="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        {/if}

        {#if selectedColumnId === "projects"}
          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <label
              for="subtasks"
              class="block text-sm font-medium text-indigo-800 mb-2"
            >
              📝 Project Subtasks
            </label>
            <textarea
              id="subtasks"
              bind:value={subtasks}
              placeholder="One subtask per line..."
              rows="4"
              class="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
            ></textarea>
            <p class="text-xs text-indigo-600 mt-1">
              Each line will become a separate subtask
            </p>
          </div>
        {/if}

        <div
          class="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200"
        >
          <button
            type="button"
            onclick={onClose}
            class="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
