import { html } from 'hono/html';
import { layout } from './layout';

export function profilePage() {
  return layout('Profile', 'profile', html`
    <div id="app">
      <div class="max-w-2xl">
        <h2 class="text-2xl font-bold mb-6">Your Profile</h2>
        <form id="profile-form" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Skills (comma-separated)</label>
            <input type="text" id="profile-skills" placeholder="React, TypeScript, Node.js..."
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Hourly Rate ($)</label>
              <input type="number" id="profile-rate" placeholder="75"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Min Budget ($)</label>
              <input type="number" id="profile-min-budget" placeholder="500"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Preferred Tiers</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" id="tier-expert" value="expert" class="rounded bg-gray-800 border-gray-600"> Expert
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" id="tier-intermediate" value="intermediate" class="rounded bg-gray-800 border-gray-600"> Intermediate
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" id="tier-entry" value="entry" class="rounded bg-gray-800 border-gray-600"> Entry Level
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">API Key (for extension)</label>
            <input type="text" id="profile-api-key" placeholder="auto-generated"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" readonly>
          </div>
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Save Profile
          </button>
          <div id="save-status" class="text-sm mt-2"></div>
        </form>
      </div>
    </div>
    <script type="module" src="/static/profile.js"></script>
  `);
}
