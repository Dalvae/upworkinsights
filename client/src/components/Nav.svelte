<script lang="ts">
  import { link, location } from 'svelte-spa-router';

  const navItems = [
    { href: '/', label: 'Dashboard', path: '/' },
    { href: '/jobs', label: 'Jobs', path: '/jobs' },
    { href: '/analytics', label: 'Analytics', path: '/analytics' },
    { href: '/profile', label: 'Profile', path: '/profile' },
  ];
</script>

<nav class="bg-gray-900 border-b border-gray-800">
  <div class="container py-3 flex items-center justify-between">
    <a href="/" use:link class="flex items-center gap-2 text-xl font-bold text-white">
      <iconify-icon icon="simple-icons:upwork" width="24" style="color: #6fda44"></iconify-icon>
      Insights
    </a>
    <div class="flex gap-6">
      {#each navItems as item}
        <a
          href={item.href}
          use:link
          class="text-sm {$location === item.path || ($location.startsWith(item.path + '/') && item.path !== '/') ? 'text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'}"
        >{item.label}</a>
      {/each}
    </div>
  </div>
</nav>
