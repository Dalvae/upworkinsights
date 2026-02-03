<script lang="ts">
  import { api } from '../lib/api';
  import Loading from '../components/Loading.svelte';

  let loading = $state(true);
  let skills = $state('');
  let rate = $state('');
  let minBudget = $state('');
  let apiKey = $state('');
  let tiers = $state<Record<string, boolean>>({ expert: false, intermediate: false, entry: false });
  let saveStatus = $state('');
  let saveStatusColor = $state('');

  async function load() {
    try {
      const profile = await api.getProfile();
      skills = (profile.skills || []).join(', ');
      rate = profile.hourly_rate || '';
      minBudget = profile.min_budget || '';
      apiKey = profile.api_key || '';
      (profile.preferred_tiers || []).forEach((t: string) => {
        tiers[t] = true;
      });
      loading = false;
    } catch {
      loading = false;
    }
  }

  async function save(e: Event) {
    e.preventDefault();
    const selectedTiers = Object.entries(tiers).filter(([, v]) => v).map(([k]) => k);
    const data = {
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      hourly_rate: rate ? parseFloat(rate) : null,
      min_budget: minBudget ? parseFloat(minBudget) : null,
      preferred_tiers: selectedTiers,
      api_key: apiKey || crypto.randomUUID(),
    };

    try {
      const saved = await api.saveProfile(data);
      apiKey = saved.api_key || '';
      saveStatus = 'Profile saved!';
      saveStatusColor = 'text-green-400';
    } catch {
      saveStatus = 'Error saving profile';
      saveStatusColor = 'text-red-400';
    }
  }

  load();
</script>

{#if loading}
  <Loading />
{:else}
  <div class="max-w-2xl">
    <h2 class="text-2xl font-bold mb-6">Your Profile</h2>
    <form onsubmit={save} class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Skills (comma-separated)</label>
        <input type="text" bind:value={skills} placeholder="React, TypeScript, Node.js..."
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Hourly Rate ($)</label>
          <input type="number" bind:value={rate} placeholder="75"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Min Budget ($)</label>
          <input type="number" bind:value={minBudget} placeholder="500"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Preferred Tiers</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={tiers.expert} class="rounded bg-gray-800 border-gray-600"> Expert
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={tiers.intermediate} class="rounded bg-gray-800 border-gray-600"> Intermediate
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={tiers.entry} class="rounded bg-gray-800 border-gray-600"> Entry Level
          </label>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">API Key (for extension)</label>
        <input type="text" bind:value={apiKey} placeholder="auto-generated"
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" readonly>
      </div>
      <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
        Save Profile
      </button>
      {#if saveStatus}
        <div class="text-sm mt-2 {saveStatusColor}">{saveStatus}</div>
      {/if}
    </form>
  </div>
{/if}
