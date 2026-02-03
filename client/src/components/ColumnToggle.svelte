<script lang="ts">
  import type { Table, RowData } from "@tanstack/table-core";
  import { Popover } from "bits-ui";
  import UiCheckbox from "./ui/UiCheckbox.svelte";

  let {
    table,
  }: {
    table: Table<any>;
  } = $props();
</script>

<Popover.Root>
  <Popover.Trigger
    class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300
           hover:border-gray-600 hover:text-gray-100 focus:outline-none focus:border-blue-500
           flex items-center gap-2 cursor-pointer"
  >
    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
    Columns
  </Popover.Trigger>
  <Popover.Content
    class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-3 space-y-2 min-w-[160px]"
    sideOffset={4}
    align="end"
  >
    {#each table.getAllLeafColumns().filter((col) => col.getCanHide()) as column (column.id)}
      <UiCheckbox
        label={typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
        checked={column.getIsVisible()}
        onCheckedChange={(v) => column.toggleVisibility(!!v)}
      />
    {/each}
  </Popover.Content>
</Popover.Root>
