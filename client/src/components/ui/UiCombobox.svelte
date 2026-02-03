<script lang="ts">
  import { Combobox } from "bits-ui";

  type Option = { value: string; label: string };

  let {
    options,
    value = $bindable(""),
    placeholder = "Search...",
  }: {
    options: Option[];
    value?: string;
    placeholder?: string;
  } = $props();

  let search = $state("");
  let filtered = $derived(
    search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options
  );
</script>

<Combobox.Root type="single" bind:value>
  <div class="relative">
    <Combobox.Input
      bind:value={search}
      {placeholder}
      class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm
             text-gray-100 w-40 focus:outline-none focus:border-blue-500"
    />
  </div>
  <Combobox.Portal>
    <Combobox.Content
      class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
      sideOffset={4}
    >
      <Combobox.Viewport class="p-1 max-h-48">
        {#each filtered as opt (opt.value)}
          <Combobox.Item
            value={opt.value}
            label={opt.label}
            class="px-3 py-1.5 text-sm text-gray-300 rounded cursor-pointer
                   data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
          >
            {opt.label}
          </Combobox.Item>
        {:else}
          <div class="px-3 py-2 text-sm text-gray-500">No results</div>
        {/each}
      </Combobox.Viewport>
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
