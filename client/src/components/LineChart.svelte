<script lang="ts">
  import Chart from '$layerchart/components/Chart.svelte';
  import Svg from '$layerchart/components/layout/Svg.svelte';
  import Axis from '$layerchart/components/Axis.svelte';
  import Area from '$layerchart/components/Area.svelte';
  import Spline from '$layerchart/components/Spline.svelte';
  import { scalePoint, scaleLinear } from 'd3-scale';
  import { curveMonotoneX } from 'd3-shape';

  let {
    labels,
    datasets,
  }: {
    labels: string[];
    datasets: { label: string; data: number[]; color: string }[];
  } = $props();

  // Transform into flat array of objects: { label, ds0, ds1, ... }
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
  {#each datasets as ds, di}
    {#if di === 0}
      <Chart
        data={chartData}
        x="label"
        xScale={scalePoint()}
        y={`ds${di}`}
        yScale={scaleLinear()}
        yDomain={[0, yMax]}
        yNice
        padding={{ top: 10, right: 16, bottom: 32, left: 48 }}
      >
        <Svg>
          <Axis placement="bottom" classes={{ text: 'fill-gray-400 text-xs' }} />
          <Axis placement="left" classes={{ text: 'fill-gray-400 text-xs' }} grid={{ class: 'stroke-gray-700' }} />
          {#each datasets as innerDs, innerDi}
            <Area
              y1={d => d[`ds${innerDi}`]}
              fill={innerDs.color.replace(/[\d.]+\)$/g, '0.15)')}
              curve={curveMonotoneX}
            />
            <Spline
              y={d => d[`ds${innerDi}`]}
              stroke={innerDs.color}
              strokeWidth={2}
              curve={curveMonotoneX}
            />
          {/each}
        </Svg>
      </Chart>
    {/if}
  {/each}
</div>
