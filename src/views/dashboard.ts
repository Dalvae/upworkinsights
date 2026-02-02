import { html } from 'hono/html';
import { layout } from './layout';

export function dashboardPage() {
  return layout('Dashboard', 'dashboard', html`
    <div id="app">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <div class="text-gray-400 text-sm">Total Jobs</div>
          <div id="stat-total" class="text-3xl font-bold mt-1">-</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <div class="text-gray-400 text-sm">Today</div>
          <div id="stat-today" class="text-3xl font-bold mt-1">-</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <div class="text-gray-400 text-sm">Avg Fixed Budget</div>
          <div id="stat-budget" class="text-3xl font-bold mt-1">-</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <div class="text-gray-400 text-sm">Fixed / Hourly</div>
          <div id="stat-types" class="text-3xl font-bold mt-1">-</div>
        </div>
      </div>

      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-8">
        <h3 class="text-lg font-semibold mb-4">Jobs Trend (Last 30 Days)</h3>
        <div style="height: 300px;">
          <canvas id="trends-chart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Top Skills</h3>
          <div style="height: 350px;">
            <canvas id="skills-chart"></canvas>
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Tier Breakdown</h3>
          <div style="height: 300px;">
            <canvas id="tier-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <h3 class="text-lg font-semibold mb-4">Top Countries</h3>
        <div style="height: 300px;">
          <canvas id="countries-chart"></canvas>
        </div>
      </div>
    </div>
    <script type="module" src="/static/dashboard.js"></script>
  `);
}
