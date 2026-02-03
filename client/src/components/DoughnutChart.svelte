<script lang="ts">
  import type { Chart } from 'chart.js/auto';
  import { createDoughnutChart } from '../lib/charts';

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
    const l = labels;
    const d = data;

    if (chart) chart.destroy();
    if (canvas && l.length > 0) {
      chart = createDoughnutChart(canvas, l, d, colors);
    }

    return () => {
      if (chart) chart.destroy();
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
