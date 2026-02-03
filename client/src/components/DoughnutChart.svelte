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

  const total = $derived(data.reduce((s, v) => s + v, 0));

  const colorScale = $derived(
    scaleOrdinal<string, string>()
      .domain(labels)
      .range(colors ?? defaultColors)
  );

  let hoveredIndex = $state(-1);
</script>

<div class="h-full w-full flex">
  <div class="flex-1">
    <Chart data={chartData} x="value">
      <Svg>
        <Group center>
          <Pie innerRadius={0.6} let:arcs>
            {#each arcs as arc, i}
              <g
                class="transition-opacity duration-150"
                style:opacity={hoveredIndex === -1 || hoveredIndex === i ? 1 : 0.4}
                onpointerenter={() => hoveredIndex = i}
                onpointerleave={() => hoveredIndex = -1}
              >
                <Arc
                  startAngle={arc.startAngle}
                  endAngle={arc.endAngle}
                  padAngle={arc.padAngle}
                  innerRadius={0.6}
                  fill={colorScale(arc.data.category)}
                  stroke="none"
                />
              </g>
            {/each}
          </Pie>
        </Group>
      </Svg>
    </Chart>
  </div>
  <div class="flex flex-col justify-center gap-1.5 text-xs pr-2 min-w-[90px]">
    {#each chartData as item, i}
      <div
        class="flex items-center gap-1.5 transition-opacity duration-150"
        style:opacity={hoveredIndex === -1 || hoveredIndex === i ? 1 : 0.4}
        onpointerenter={() => hoveredIndex = i}
        onpointerleave={() => hoveredIndex = -1}
      >
        <span class="inline-block w-2.5 h-2.5 rounded-full shrink-0" style:background={colorScale(item.category)}></span>
        <span class="text-gray-300 truncate">{item.category}</span>
        <span class="text-gray-400 font-mono ml-auto">{total > 0 ? Math.round(item.value / total * 100) : 0}%</span>
      </div>
    {/each}
  </div>
</div>
