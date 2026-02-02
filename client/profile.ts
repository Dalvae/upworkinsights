import { api } from './lib/api';

async function init() {
  const profile = await api.getProfile();

  const skillsInput = document.getElementById('profile-skills') as HTMLInputElement;
  const rateInput = document.getElementById('profile-rate') as HTMLInputElement;
  const minBudgetInput = document.getElementById('profile-min-budget') as HTMLInputElement;
  const apiKeyInput = document.getElementById('profile-api-key') as HTMLInputElement;

  skillsInput.value = (profile.skills || []).join(', ');
  rateInput.value = profile.hourly_rate || '';
  minBudgetInput.value = profile.min_budget || '';
  apiKeyInput.value = profile.api_key || '';

  (profile.preferred_tiers || []).forEach((t: string) => {
    const cb = document.getElementById(`tier-${t}`) as HTMLInputElement;
    if (cb) cb.checked = true;
  });

  document.getElementById('profile-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('save-status')!;

    const tiers: string[] = [];
    ['expert', 'intermediate', 'entry'].forEach((t) => {
      if ((document.getElementById(`tier-${t}`) as HTMLInputElement).checked) tiers.push(t);
    });

    const data = {
      skills: skillsInput.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      hourly_rate: rateInput.value ? parseFloat(rateInput.value) : null,
      min_budget: minBudgetInput.value ? parseFloat(minBudgetInput.value) : null,
      preferred_tiers: tiers,
      api_key: apiKeyInput.value || crypto.randomUUID(),
    };

    try {
      const saved = await api.saveProfile(data);
      apiKeyInput.value = saved.api_key || '';
      statusEl.textContent = 'Profile saved!';
      statusEl.className = 'text-sm mt-2 text-green-400';
    } catch {
      statusEl.textContent = 'Error saving profile';
      statusEl.className = 'text-sm mt-2 text-red-400';
    }
  });
}

init();
