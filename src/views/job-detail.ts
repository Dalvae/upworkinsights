import { html } from 'hono/html';
import { layout } from './layout';

export function jobDetailPage(id: string) {
  return layout('Job Detail', 'jobs', html`
    <div id="app">
      <a href="/jobs" class="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to Jobs</a>

      <div id="job-loading" class="text-center text-gray-500 py-12">Loading job...</div>

      <div id="job-content" class="hidden">
        <div class="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <div class="flex justify-between items-start mb-3">
            <h1 id="job-title" class="text-xl font-bold text-gray-100"></h1>
            <span id="job-budget" class="text-2xl font-bold text-green-400 whitespace-nowrap ml-4"></span>
          </div>
          <div id="job-meta" class="flex flex-wrap gap-3 mb-4 text-sm"></div>
          <div id="job-skills" class="flex flex-wrap gap-2 mb-4"></div>
          <div id="job-description" class="text-sm text-gray-400 whitespace-pre-line"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
            <h3 class="text-lg font-semibold mb-4">Proposal Evolution</h3>
            <div id="no-history" class="hidden text-gray-500 text-sm py-8 text-center">
              No history yet. Snapshots are captured each time the extension sees this job.
            </div>
            <div id="history-chart-container" style="height: 250px;">
              <canvas id="history-chart"></canvas>
            </div>
          </div>
          <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
            <h3 class="text-lg font-semibold mb-4">Client Info</h3>
            <div id="client-info" class="space-y-3"></div>
          </div>
        </div>

        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-2">Match Score</h3>
          <div id="match-section"></div>
        </div>
      </div>
    </div>
    <script>window.__JOB_ID__ = "${id}";</script>
    <script type="module" src="/static/job-detail.js"></script>
  `);
}
