<script lang="ts">
  import type { Chart } from 'chart.js';
  import { createBarChart, updateBarChart } from '../lib/charts';
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
    const l = $state.snapshot(labels) as string[];
    const d = $state.snapshot(data) as number[];

    if (!canvas || l.length === 0) return;

    untrack(() => {
      if (chart) {
        updateBarChart(chart, l, d);
      } else {
        chart = createBarChart(canvas, l, d, { color, horizontal, label });
      }
    });

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
