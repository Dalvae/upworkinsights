import { wrap } from 'svelte-spa-router/wrap';

export const routes = {
  '/': wrap({ asyncComponent: () => import('./pages/Dashboard.svelte') }),
  '/jobs': wrap({ asyncComponent: () => import('./pages/Jobs.svelte') }),
  '/jobs/:id': wrap({ asyncComponent: () => import('./pages/JobDetail.svelte') }),
  '/analytics': wrap({ asyncComponent: () => import('./pages/Analytics.svelte') }),
  '/profile': wrap({ asyncComponent: () => import('./pages/Profile.svelte') }),
  '*': wrap({ asyncComponent: () => import('./pages/NotFound.svelte') }),
};
