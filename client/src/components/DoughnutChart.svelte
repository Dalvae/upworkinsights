<script lang="ts">
  import Chart from '$layerchart/components/Chart.svelte';
  import Svg from '$layerchart/components/layout/Svg.svelte';
  import Pie from '$layerchart/components/Pie.svelte';
  import Arc from '$layerchart/components/Arc.svelte';
  import Group from '$layerchart/components/Group.svelte';
  import { scaleOrdinal } from 'd3-scale';

  let {
    labels,
    data,
    colors,
  }: {
    labels: string[];
    data: number[];
    colors?: string[];
  } = $props();

  const defaultColors = [
    'rgba(168, 85, 247, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(6, 182, 212, 0.8)',
  ];

  const chartData = $derived(
    labels.map((l, i) => ({ category: l, value: data[i] ?? 0 }))
  );

  const colorScale = $derived(
    scaleOrdinal<string, string>()
      .domain(labels)
      .range(colors ?? defaultColors)
  );
</script>

<div class="h-full w-full">
  <Chart data={chartData} x="value">
    <Svg>
      <Group center>
        <Pie innerRadius={0.6} let:arcs>
          {#each arcs as arc}
            <Arc
              startAngle={arc.startAngle}
              endAngle={arc.endAngle}
              padAngle={arc.padAngle}
              innerRadius={0.6}
              fill={colorScale(arc.data.category)}
            />
          {/each}
        </Pie>
      </Group>
    </Svg>
  </Chart>
</div>
