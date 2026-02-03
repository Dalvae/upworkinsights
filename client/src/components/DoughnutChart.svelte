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
    const l = labels;
    const d = data;

    untrack(() => {
      if (chart) {
        chart.destroy();
        chart = undefined;
      }
    });

    if (canvas && l.length > 0) {
      chart = createDoughnutChart(canvas, l, d, colors);
    }

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
