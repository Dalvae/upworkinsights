<script lang="ts" generics="TProps extends Record<string, any>">
  import { type Snippet } from "svelte";
  import type { CellContext, HeaderContext } from "@tanstack/table-core";

  let {
    content,
    context,
  }: {
    content:
      | string
      | ((ctx: any) => any)
      | Snippet<[any]>
      | undefined;
    context: HeaderContext<any, any> | CellContext<any, any>;
  } = $props();
</script>

{#if typeof content === "string"}
  {content}
{:else if typeof content === "function"}
  {@const result = content(context)}
  {#if typeof result === "string"}
    {result}
  {:else}
    {result}
  {/if}
{/if}
