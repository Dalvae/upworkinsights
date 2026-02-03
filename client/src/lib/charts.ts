import { Chart } from 'chart.js/auto';

export function createBarChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  data: number[],
  options?: {
    color?: string;
    horizontal?: boolean;
    label?: string;
  }
): Chart {
  const color = options?.color || 'rgba(59, 130, 246, 0.8)';
  const horizontal = options?.horizontal || false;
  const label = options?.label || 'Data';

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: color,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: !horizontal } },
        y: { grid: { display: horizontal } },
      },
    },
  });
}

export function createDoughnutChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  data: number[],
  colors?: string[]
): Chart {
  const defaultColors = [
    'rgba(168, 85, 247, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(6, 182, 212, 0.8)',
  ];

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors || defaultColors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: 'right' },
      },
    },
  });
}

export function createLineChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[]
): Chart {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color.replace(/[\d.]+\)$/g, '0.1)'),
        tension: 0.3,
        fill: true,
        pointRadius: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: true } },
        y: { grid: { display: true } },
      },
    },
  });
}
