<script lang="ts">
  import Chart from '$layerchart/components/Chart.svelte';
  import Svg from '$layerchart/components/layout/Svg.svelte';
  import Axis from '$layerchart/components/Axis.svelte';
  import Area from '$layerchart/components/Area.svelte';
  import Spline from '$layerchart/components/Spline.svelte';
  import Highlight from '$layerchart/components/Highlight.svelte';
  import TooltipContext from '$layerchart/components/tooltip/TooltipContext.svelte';
  import TooltipRoot from '$layerchart/components/tooltip/Tooltip.svelte';
  import { scalePoint, scaleLinear } from 'd3-scale';
  import { curveMonotoneX } from 'd3-shape';

  let {
    labels,
    datasets,
  }: {
    labels: string[];
    datasets: { label: string; data: number[]; color: string }[];
  } = $props();

  const chartData = $derived(
    labels.map((l, i) => {
      const row: Record<string, string | number> = { label: l };
      datasets.forEach((ds, di) => {
        row[`ds${di}`] = ds.data[i] ?? 0;
      });
      return row;
    })
  );

  const yMax = $derived(
    Math.max(...datasets.flatMap((ds) => ds.data), 0) * 1.1 || 10
  );
</script>

<div class="h-full w-full">
  <Chart
    data={chartData}
    x="label"
    xScale={scalePoint()}
    y="ds0"
    yScale={scaleLinear()}
    yDomain={[0, yMax]}
    yNice
    padding={{ top: 10, right: 16, bottom: 32, left: 48 }}
    tooltip={{ mode: 'bisect-x' }}
  >
    <Svg>
      <Axis placement="bottom" classes={{ text: 'fill-gray-400 text-xs' }} />
      <Axis placement="left" classes={{ text: 'fill-gray-400 text-xs' }} grid={{ class: 'stroke-gray-700' }} />
      {#each datasets as ds, di}
        <Area
          y1={d => d[`ds${di}`]}
          fill={ds.color.replace(/[\d.]+\)$/g, '0.15)')}
          curve={curveMonotoneX}
        />
        <Spline
          y={d => d[`ds${di}`]}
          stroke={ds.color}
          strokeWidth={2}
          curve={curveMonotoneX}
        />
      {/each}
      <Highlight points lines={{ class: 'stroke-gray-400 [stroke-dasharray:4]' }} />
    </Svg>
    <TooltipRoot x="data" let:data>
      <div class="bg-gray-800 border border-gray-600 text-gray-100 text-xs rounded px-2 py-1.5 shadow-lg space-y-0.5">
        <div class="font-semibold">{data.label}</div>
        {#each datasets as ds, di}
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-full" style:background={ds.color}></span>
            {ds.label}: <span class="font-mono">{data[`ds${di}`]}</span>
          </div>
        {/each}
      </div>
    </TooltipRoot>
  </Chart>
</div>
