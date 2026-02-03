import { mount } from 'svelte';
import { Chart } from 'chart.js/auto';
import App from './App.svelte';
import './app.css';

// Chart.js dark theme defaults
Chart.defaults.color = '#9ca3af';
Chart.defaults.borderColor = '#374151';
Chart.defaults.font.family = 'system-ui, sans-serif';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
