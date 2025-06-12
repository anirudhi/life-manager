<script lang="ts">
  interface Props {
    value: string;
  }

  let { value = $bindable() }: Props = $props();
  let focused = $state(false);
</script>

<div class="relative group">
  <div
    class={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focused ? "text-blue-500" : "text-gray-400"}`}
  >
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
  <input
    type="text"
    bind:value
    placeholder="Search tasks..."
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
    class={`
      block w-full pl-12 pr-4 py-3 
      border rounded-lg
      leading-5 bg-white 
      placeholder-gray-500 
      text-gray-900
      transition-all duration-200
      focus:outline-none 
      focus:placeholder-gray-400 
      focus:ring-2 
      focus:border-transparent
      hover:border-gray-400
      ${
        focused
          ? "border-blue-500 ring-blue-500 shadow-lg"
          : "border-gray-300 shadow-sm"
      }
      sm:text-sm
    `}
  />

  {#if value}
    <button
      onclick={() => (value = "")}
      class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
      title="Clear search"
    >
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  {/if}
</div>
