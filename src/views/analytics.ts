import { html } from 'hono/html';
import { layout } from './layout';

export function analyticsPage() {
  return layout('Analytics', 'analytics', html`
    <div id="app">
      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Budget Trends</h3>
          <select id="trends-days" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-100">
            <option value="7">7 days</option>
            <option value="30" selected>30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
        <div style="height: 300px;">
          <canvas id="budget-trends-chart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Skills Demand (Top 15)</h3>
          <div style="height: 400px;">
            <canvas id="skills-demand-chart"></canvas>
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Tier Distribution Over Time</h3>
          <div style="height: 400px;">
            <canvas id="tier-trends-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Budget Distribution (Fixed)</h3>
          <div style="height: 300px;">
            <canvas id="budget-chart"></canvas>
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Hourly Rate Distribution</h3>
          <div style="height: 300px;">
            <canvas id="hourly-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-8">
        <h3 class="text-lg font-semibold mb-4">Competition Analysis</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 class="text-sm text-gray-400 mb-3">Avg Proposals/Hour by Tier</h4>
            <div style="height: 200px;">
              <canvas id="velocity-tier-chart"></canvas>
            </div>
          </div>
          <div>
            <h4 class="text-sm text-gray-400 mb-3">Proposal Distribution</h4>
            <div style="height: 200px;">
              <canvas id="proposal-dist-chart"></canvas>
            </div>
          </div>
          <div>
            <h4 class="text-sm text-gray-400 mb-3">Hottest Jobs (Fastest Proposals)</h4>
            <div id="hottest-jobs" class="space-y-1 max-h-52 overflow-y-auto"></div>
          </div>
        </div>
      </div>

      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <h3 class="text-lg font-semibold mb-4">Top Matches</h3>
        <div id="matches-list"></div>
      </div>
    </div>
    <script type="module" src="/static/analytics.js"></script>
  `);
}
