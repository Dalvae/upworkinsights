<script lang="ts">
  import { tierColor } from '../lib/format';

  let { tier }: { tier: string | null } = $props();
</script>

{#if tier}
  <span class="text-xs px-2 py-0.5 rounded capitalize {tierColor[tier] || ''}">{tier}</span>
{:else}
  <span>-</span>
{/if}
