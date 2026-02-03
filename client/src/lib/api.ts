const BASE = '';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getOverview: () => fetchJSON<any>('/api/analytics/overview'),
  getJobs: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return fetchJSON<any>(`/api/jobs?${qs}`);
  },
  getJob: (id: string) => fetchJSON<any>(`/api/jobs/${id}`),
  getSkills: (limit = 30) => fetchJSON<any>(`/api/analytics/skills?limit=${limit}`),
  getBudgets: () => fetchJSON<any>('/api/analytics/budgets'),
  getMatches: (limit = 20) => fetchJSON<any>(`/api/analytics/matches?limit=${limit}`),
  getTrends: (days = 30) => fetchJSON<any>(`/api/analytics/trends?days=${days}`),
  getJobHistory: (id: string) => fetchJSON<any>(`/api/jobs/${id}/history`),
  getProposalStats: () => fetchJSON<any>('/api/analytics/proposals'),
  getProfile: () => fetchJSON<any>('/api/profile'),
  saveProfile: (data: any) =>
    fetchJSON<any>('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
};
