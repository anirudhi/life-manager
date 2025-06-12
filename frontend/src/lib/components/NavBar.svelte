<script lang="ts">
  import { page } from '$app/stores';
  
  const navItems = [
    { href: '/', label: 'All Tasks' },
    { href: '/today', label: 'Today' },
    { href: '/zen', label: 'Zen' }
  ];
</script>

<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50">
  <nav class="bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/20">
    <div class="px-4 py-2">
      <div class="flex space-x-1">
        {#each navItems as item}
          <a
            href={item.href}
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out
              {$page.url.pathname === item.href
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'}"
          >
            {item.label}
          </a>
        {/each}
      </div>
    </div>
  </nav>
</div>