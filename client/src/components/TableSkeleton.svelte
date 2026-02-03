<script lang="ts">
  let {
    rows = 10,
    columns = 8,
  }: {
    rows?: number;
    columns?: number;
  } = $props();
</script>

<div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden animate-pulse">
  <table class="w-full text-sm text-left">
    <thead class="bg-gray-800/50">
      <tr>
        {#each Array(columns) as _, i}
          <th class="px-4 py-3">
            <div class="h-3 bg-gray-700 rounded w-16"></div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-800">
      {#each Array(rows) as _, r}
        <tr>
          {#each Array(columns) as _, c}
            <td class="px-4 py-3">
              {#if c === 0}
                <div class="space-y-1.5">
                  <div class="h-4 bg-gray-800 rounded w-48"></div>
                  <div class="h-3 bg-gray-800/60 rounded w-64"></div>
                  <div class="flex gap-1">
                    <div class="h-4 bg-gray-800 rounded w-12"></div>
                    <div class="h-4 bg-gray-800 rounded w-14"></div>
                  </div>
                </div>
              {:else}
                <div class="h-4 bg-gray-800 rounded w-14"></div>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
