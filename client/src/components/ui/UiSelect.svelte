<script lang="ts">
  import { Select } from "bits-ui";

  type Option = { value: string; label: string };

  let {
    options,
    value = $bindable(""),
    placeholder = "Select...",
    class: className = "",
  }: {
    options: Option[];
    value?: string;
    placeholder?: string;
    class?: string;
  } = $props();
</script>

<Select.Root type="single" bind:value>
  <Select.Trigger
    class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100
           hover:border-gray-600 focus:outline-none focus:border-blue-500
           flex items-center justify-between gap-2 min-w-[120px] cursor-pointer {className}"
  >
    {#snippet children({ selectedLabel })}
      <span class="truncate">{selectedLabel || placeholder}</span>
      <span class="text-gray-500 text-xs">&#9660;</span>
    {/snippet}
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
      sideOffset={4}
    >
      <Select.Viewport class="p-1 max-h-60">
        {#each options as opt}
          <Select.Item
            value={opt.value}
            label={opt.label}
            class="px-3 py-1.5 text-sm text-gray-300 rounded cursor-pointer
                   data-[highlighted]:bg-gray-700 data-[highlighted]:text-white
                   data-[selected]:text-blue-400"
          >
            {opt.label}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
