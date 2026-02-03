<script lang="ts">
  import type { Chart } from 'chart.js/auto';
  import { createDoughnutChart } from '../lib/charts';
  import { untrack } from 'svelte';

  let {
    labels,
    data,
    colors,
  }: {
    labels: string[];
    data: number[];
    colors?: string[];
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const l = $state.snapshot(labels) as string[];
    const d = $state.snapshot(data) as number[];
    const c = colors ? $state.snapshot(colors) as string[] : undefined;

    untrack(() => {
      if (chart) {
        chart.destroy();
        chart = undefined;
      }
    });

    if (canvas && l.length > 0) {
      chart = createDoughnutChart(canvas, l, d, c);
    }

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
