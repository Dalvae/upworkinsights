import { html } from 'hono/html';

export function layout(title: string, activePage: string, content: any) {
  const navLink = (href: string, label: string, page: string) =>
    html`<a href="${href}" class="text-sm ${activePage === page ? 'text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'}">${label}</a>`;

  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Insights</title>
  <link rel="stylesheet" href="/static/styles.css">
  <script src="https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js"></script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen">
  <nav class="bg-gray-900 border-b border-gray-800">
    <div class="container py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 text-xl font-bold text-white">
        <iconify-icon icon="simple-icons:upwork" width="24" style="color: #6fda44"></iconify-icon>
        Insights
      </a>
      <div class="flex gap-6">
        ${navLink('/', 'Dashboard', 'dashboard')}
        ${navLink('/jobs', 'Jobs', 'jobs')}
        ${navLink('/analytics', 'Analytics', 'analytics')}
        ${navLink('/profile', 'Profile', 'profile')}
      </div>
    </div>
  </nav>
  <main class="container py-8">
    ${content}
  </main>
</body>
</html>`;
}
