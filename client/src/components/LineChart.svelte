<script lang="ts">
  import type { Chart } from 'chart.js';
  import { createLineChart, updateLineChart } from '../lib/charts';
  import { untrack } from 'svelte';

  let {
    labels,
    datasets,
  }: {
    labels: string[];
    datasets: { label: string; data: number[]; color: string }[];
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const l = $state.snapshot(labels) as string[];
    const d = $state.snapshot(datasets) as { label: string; data: number[]; color: string }[];

    if (!canvas || l.length === 0) return;

    untrack(() => {
      if (chart) {
        updateLineChart(chart, l, d);
      } else {
        chart = createLineChart(canvas, l, d);
      }
    });

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
