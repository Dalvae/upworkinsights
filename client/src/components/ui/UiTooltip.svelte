<script lang="ts">
  import { Tooltip } from "bits-ui";
  import type { Snippet } from "svelte";

  let {
    text,
    children,
  }: {
    text: string;
    children: Snippet;
  } = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger asChild>
    {@render children()}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content
      class="bg-gray-900 border border-gray-700 text-gray-200 text-xs
             rounded-lg px-3 py-1.5 shadow-lg max-w-xs z-50"
      sideOffset={4}
    >
      {text}
      <Tooltip.Arrow class="fill-gray-900" />
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
