<script lang="ts">
  import type { Chart } from 'chart.js/auto';
  import { createBarChart } from '../lib/charts';

  let {
    labels,
    data,
    color = 'rgba(59, 130, 246, 0.8)',
    horizontal = false,
    label = 'Data',
  }: {
    labels: string[];
    data: number[];
    color?: string;
    horizontal?: boolean;
    label?: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const l = labels;
    const d = data;

    if (chart) chart.destroy();
    if (canvas && l.length > 0) {
      chart = createBarChart(canvas, l, d, { color, horizontal, label });
    }

    return () => {
      if (chart) chart.destroy();
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
