<script lang="ts">
  import { Pagination } from "bits-ui";

  let {
    page = $bindable(1),
    total,
    perPage,
    onPageChange,
  }: {
    page?: number;
    total: number;
    perPage: number;
    onPageChange: (p: number) => void;
  } = $props();
</script>

{#if total > perPage}
  <Pagination.Root
    count={total}
    {perPage}
    bind:page
    siblingCount={2}
    onPageChange={(p) => onPageChange(p)}
  >
    {#snippet children({ pages })}
      <div class="mt-6 flex justify-center gap-1">
        <Pagination.PrevButton
          class="px-3 py-1.5 text-sm rounded bg-gray-800 text-gray-300
                 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </Pagination.PrevButton>

        {#each pages as p (p.key)}
          {#if p.type === "ellipsis"}
            <span class="px-2 py-1.5 text-gray-500">...</span>
          {:else}
            <Pagination.Page
              page={p}
              class="px-3 py-1.5 text-sm rounded cursor-pointer
                     data-[selected]:bg-blue-600 data-[selected]:text-white
                     bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              {p.value}
            </Pagination.Page>
          {/if}
        {/each}

        <Pagination.NextButton
          class="px-3 py-1.5 text-sm rounded bg-gray-800 text-gray-300
                 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </Pagination.NextButton>
      </div>
    {/snippet}
  </Pagination.Root>
{/if}
