<script lang="ts">
  import Chart from '$layerchart/components/Chart.svelte';
  import Svg from '$layerchart/components/layout/Svg.svelte';
  import Axis from '$layerchart/components/Axis.svelte';
  import Bar from '$layerchart/components/Bar.svelte';
  import Highlight from '$layerchart/components/Highlight.svelte';
  import TooltipContext from '$layerchart/components/tooltip/TooltipContext.svelte';
  import TooltipRoot from '$layerchart/components/tooltip/Tooltip.svelte';
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

  const leftPad = $derived(
    horizontal ? Math.min(Math.max(...labels.map(l => l.length * 7), 50), 160) : 48
  );
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
      padding={{ top: 10, right: 16, bottom: 32, left: leftPad }}
      tooltip={{ mode: 'band' }}
    >
      <Svg>
        <Axis placement="bottom" classes={{ text: 'fill-gray-400 text-xs' }} />
        <Axis placement="left" classes={{ text: 'fill-gray-400 text-xs' }} />
        {#each chartData as bar}
          <Bar {bar} fill={color} radius={4} rounded="right" />
        {/each}
        <Highlight area />
      </Svg>
      <TooltipRoot let:data>
        <div class="bg-gray-800 border border-gray-600 text-gray-100 text-xs rounded px-2 py-1 shadow-lg">
          <div class="font-semibold">{data.category}</div>
          <div>{label}: <span class="font-mono">{data.value}</span></div>
        </div>
      </TooltipRoot>
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
      tooltip={{ mode: 'band' }}
    >
      <Svg>
        <Axis placement="bottom" classes={{ text: 'fill-gray-400 text-xs' }} />
        <Axis placement="left" classes={{ text: 'fill-gray-400 text-xs' }} />
        {#each chartData as bar}
          <Bar {bar} fill={color} radius={4} rounded="top" />
        {/each}
        <Highlight area />
      </Svg>
      <TooltipRoot let:data>
        <div class="bg-gray-800 border border-gray-600 text-gray-100 text-xs rounded px-2 py-1 shadow-lg">
          <div class="font-semibold">{data.category}</div>
          <div>{label}: <span class="font-mono">{data.value}</span></div>
        </div>
      </TooltipRoot>
    </Chart>
  {/if}
</div>
