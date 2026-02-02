import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { dashboardPage } from '../views/dashboard';
import { jobsPage } from '../views/jobs';
import { jobDetailPage } from '../views/job-detail';
import { analyticsPage } from '../views/analytics';
import { profilePage } from '../views/profile';

const app = new Hono();

app.use('/static/*', serveStatic({ root: './dist/client' }));

app.get('/', (c) => c.html(dashboardPage()));
app.get('/jobs', (c) => c.html(jobsPage()));
app.get('/jobs/:id', (c) => c.html(jobDetailPage(c.req.param('id'))));
app.get('/analytics', (c) => c.html(analyticsPage()));
app.get('/profile', (c) => c.html(profilePage()));

export default app;
