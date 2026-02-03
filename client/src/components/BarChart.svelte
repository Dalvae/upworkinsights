<script lang="ts">
  import Chart from '$layerchart/components/Chart.svelte';
  import Svg from '$layerchart/components/layout/Svg.svelte';
  import Axis from '$layerchart/components/Axis.svelte';
  import Bar from '$layerchart/components/Bar.svelte';
  import { scaleBand, scaleLinear } from 'd3-scale';

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

  const chartData = $derived(
    labels.map((l, i) => ({ category: l, value: data[i] ?? 0 }))
  );

  const yMax = $derived(Math.max(...data, 0) * 1.1 || 10);
</script>

<div class="h-full w-full">
  {#if horizontal}
    <Chart
      data={chartData}
      x="value"
      xScale={scaleLinear()}
      xDomain={[0, yMax]}
      xNice
      y="category"
      yScale={scaleBand().padding(0.3)}
      padding={{ top: 10, right: 16, bottom: 32, left: 80 }}
    >
      <Svg>
        <Axis placement="bottom" classes={{ text: 'fill-gray-400 text-xs' }} />
        <Axis placement="left" classes={{ text: 'fill-gray-400 text-xs' }} />
        {#each chartData as bar}
          <Bar {bar} fill={color} radius={4} rounded="right" />
        {/each}
      </Svg>
    </Chart>
  {:else}
    <Chart
      data={chartData}
      x="category"
      xScale={scaleBand().padding(0.3)}
      y="value"
      yScale={scaleLinear()}
      yDomain={[0, yMax]}
      yNice
      yBaseline={0}
      padding={{ top: 10, right: 16, bottom: 32, left: 48 }}
    >
      <Svg>
        <Axis placement="bottom" classes={{ text: 'fill-gray-400 text-xs' }} />
        <Axis placement="left" classes={{ text: 'fill-gray-400 text-xs' }} />
        {#each chartData as bar}
          <Bar {bar} fill={color} radius={4} rounded="top" />
        {/each}
      </Svg>
    </Chart>
  {/if}
</div>
