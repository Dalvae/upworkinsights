<script lang="ts">
  import type { Chart } from 'chart.js/auto';
  import { createLineChart } from '../lib/charts';

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
    // Access reactive deps
    const l = labels;
    const d = datasets;

    if (chart) chart.destroy();
    if (canvas && l.length > 0) {
      chart = createLineChart(canvas, l, d);
    }

    return () => {
      if (chart) chart.destroy();
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
