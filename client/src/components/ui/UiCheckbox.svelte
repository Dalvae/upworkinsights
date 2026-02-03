<script lang="ts">
  import { Checkbox, Label, useId } from "bits-ui";

  let {
    label,
    checked = $bindable(false),
  }: {
    label: string;
    checked?: boolean;
  } = $props();

  const id = useId();
</script>

<div class="flex items-center gap-2">
  <Checkbox.Root
    bind:checked
    {id}
    class="size-5 rounded border border-gray-600 bg-gray-800
           data-[checked]:bg-blue-600 data-[checked]:border-blue-600
           flex items-center justify-center cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-blue-500/50"
  >
    {#snippet children({ checked: isChecked })}
      {#if isChecked}
        <svg class="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      {/if}
    {/snippet}
  </Checkbox.Root>
  <Label.Root for={id} class="text-sm text-gray-300 cursor-pointer select-none">
    {label}
  </Label.Root>
</div>
