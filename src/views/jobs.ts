import { html } from 'hono/html';
import { layout } from './layout';

export function jobsPage() {
  return layout('Jobs', 'jobs', html`
    <div id="app">
      <div class="mb-6 flex flex-wrap gap-3 items-center">
        <input type="text" id="search-input" placeholder="Search jobs..."
          class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64">
        <select id="filter-tier" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
          <option value="">All Tiers</option>
          <option value="expert">Expert</option>
          <option value="intermediate">Intermediate</option>
          <option value="entry">Entry Level</option>
        </select>
        <select id="filter-type" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
          <option value="">All Types</option>
          <option value="fixed">Fixed Price</option>
          <option value="hourly">Hourly</option>
        </select>
        <select id="filter-country" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
          <option value="">All Countries</option>
        </select>
        <select id="page-size" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
        <span id="results-count" class="text-sm text-gray-500 ml-auto"></span>
      </div>

      <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-400 uppercase bg-gray-800/50">
              <tr>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none" data-sort="title">
                  Title <span class="sort-icon"></span>
                </th>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none w-28" data-sort="fixed_budget">
                  Budget <span class="sort-icon"></span>
                </th>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none w-28" data-sort="tier">
                  Tier <span class="sort-icon"></span>
                </th>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none w-24" data-sort="job_type">
                  Type <span class="sort-icon"></span>
                </th>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none w-32" data-sort="client_country">
                  Country <span class="sort-icon"></span>
                </th>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none w-24" data-sort="client_quality_score">
                  Client <span class="sort-icon"></span>
                </th>
                <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none w-28" data-sort="created_on">
                  Date <span class="sort-icon"></span>
                </th>
              </tr>
            </thead>
            <tbody id="jobs-tbody" class="divide-y divide-gray-800">
            </tbody>
          </table>
        </div>
      </div>

      <div id="pagination" class="mt-6 flex justify-center gap-2"></div>
    </div>
    <script type="module" src="/static/jobs.js"></script>
  `);
}
