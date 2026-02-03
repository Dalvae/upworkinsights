<script lang="ts">
  import type { Chart } from 'chart.js/auto';
  import { createBarChart } from '../lib/charts';
  import { untrack } from 'svelte';

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

    untrack(() => {
      if (chart) {
        chart.destroy();
        chart = undefined;
      }
    });

    if (canvas && l.length > 0) {
      chart = createBarChart(canvas, l, d, { color, horizontal, label });
    }

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
