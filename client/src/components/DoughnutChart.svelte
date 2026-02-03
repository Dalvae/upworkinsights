<script lang="ts">
  import type { Chart } from 'chart.js';
  import { createDoughnutChart, updateDoughnutChart } from '../lib/charts';
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

    if (!canvas || l.length === 0) return;

    untrack(() => {
      if (chart) {
        updateDoughnutChart(chart, l, d);
      } else {
        const c = colors ? $state.snapshot(colors) as string[] : undefined;
        chart = createDoughnutChart(canvas, l, d, c);
      }
    });

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
