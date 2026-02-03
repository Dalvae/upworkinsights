import Dashboard from './pages/Dashboard.svelte';
import Jobs from './pages/Jobs.svelte';
import JobDetail from './pages/JobDetail.svelte';
import Analytics from './pages/Analytics.svelte';
import Profile from './pages/Profile.svelte';
import NotFound from './pages/NotFound.svelte';

export const routes = {
  '/': Dashboard,
  '/jobs': Jobs,
  '/jobs/:id': JobDetail,
  '/analytics': Analytics,
  '/profile': Profile,
  '*': NotFound,
};
