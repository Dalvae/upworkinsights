<script lang="ts">
  let {
    page,
    pages,
    onPageChange,
  }: {
    page: number;
    pages: number;
    onPageChange: (p: number) => void;
  } = $props();

  let visiblePages = $derived.by(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    const result: number[] = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  });
</script>

{#if pages > 1}
  <div class="mt-6 flex justify-center gap-2">
    {#if page > 1}
      <button
        onclick={() => onPageChange(page - 1)}
        class="px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700 transition-colors"
      >Prev</button>
    {/if}

    {#each visiblePages as p}
      <button
        onclick={() => onPageChange(p)}
        class="px-3 py-1.5 rounded text-sm transition-colors {p === page ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}"
      >{p}</button>
    {/each}

    {#if page < pages}
      <button
        onclick={() => onPageChange(page + 1)}
        class="px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700 transition-colors"
      >Next</button>
    {/if}
  </div>
{/if}
