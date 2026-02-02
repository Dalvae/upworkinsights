import { api } from './lib/api';

let currentPage = 1;
let currentFilters: Record<string, string> = {};
let currentSort = 'created_on';
let currentOrder = 'desc';
let currentLimit = '20';

function debounce(fn: Function, ms: number) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function updateSortIcons() {
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    const icon = th.querySelector('.sort-icon') as HTMLElement;
    const col = (th as HTMLElement).dataset.sort;
    if (col === currentSort) {
      icon.textContent = currentOrder === 'asc' ? ' ▲' : ' ▼';
      th.classList.add('text-blue-400');
    } else {
      icon.textContent = '';
      th.classList.remove('text-blue-400');
    }
  });
}

async function loadJobs() {
  const params: Record<string, string> = {
    page: String(currentPage),
    limit: currentLimit,
    sort: currentSort,
    order: currentOrder,
    ...currentFilters,
  };
  Object.keys(params).forEach((k) => {
    if (!params[k]) delete params[k];
  });

  const data = await api.getJobs(params);
  const tbody = document.getElementById('jobs-tbody')!;
  const countEl = document.getElementById('results-count')!;

  countEl.textContent = `${data.pagination.total} jobs found`;

  if (data.jobs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-12">No jobs found</td></tr>';
    document.getElementById('pagination')!.innerHTML = '';
    return;
  }

  tbody.innerHTML = data.jobs
    .map((job: any) => {
      const budget =
        job.job_type === 'fixed'
          ? job.fixed_budget
            ? `$${parseFloat(job.fixed_budget).toLocaleString()}`
            : 'N/A'
          : job.hourly_min && job.hourly_max
            ? `$${job.hourly_min}-$${job.hourly_max}/hr`
            : 'N/A';

      const tierColor: Record<string, string> = {
        expert: 'text-purple-400 bg-purple-400/10',
        intermediate: 'text-blue-400 bg-blue-400/10',
        entry: 'text-green-400 bg-green-400/10',
      };

      const date = new Date(job.created_on).toLocaleDateString();
      const score = job.client_quality_score ? parseFloat(job.client_quality_score).toFixed(1) : '-';
      const scoreColor = parseFloat(score) >= 7 ? 'text-green-400' : parseFloat(score) >= 4 ? 'text-yellow-400' : 'text-gray-400';

      const skills = (job.job_skills || [])
        .map((js: any) => js.skills?.label)
        .filter(Boolean)
        .slice(0, 3);

      return `
      <tr class="hover:bg-gray-800/50 transition-colors">
        <td class="px-4 py-3">
          <a href="/jobs/${job.id}" class="font-medium text-gray-100 hover:text-blue-400 truncate max-w-md block transition-colors" title="${job.title}">${job.title}</a>
          <div class="flex gap-1 mt-1">
            ${skills.map((s: string) => `<span class="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">${s}</span>`).join('')}
          </div>
        </td>
        <td class="px-4 py-3 text-green-400 font-medium whitespace-nowrap">${budget}</td>
        <td class="px-4 py-3">
          ${job.tier ? `<span class="text-xs px-2 py-0.5 rounded capitalize ${tierColor[job.tier] || ''}">${job.tier}</span>` : '-'}
        </td>
        <td class="px-4 py-3 text-gray-400 capitalize">${job.job_type}</td>
        <td class="px-4 py-3 text-gray-400">${job.client_country || '-'}</td>
        <td class="px-4 py-3 ${scoreColor} font-medium">${score}/10</td>
        <td class="px-4 py-3 text-gray-400 whitespace-nowrap">${date}</td>
      </tr>
    `;
    })
    .join('');

  // Pagination
  const pagEl = document.getElementById('pagination')!;
  const { page, pages, total } = data.pagination;
  if (pages > 1) {
    let btns = '';
    if (page > 1) btns += `<button data-page="${page - 1}" class="px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700 transition-colors">Prev</button>`;

    // Page numbers
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    for (let i = start; i <= end; i++) {
      btns += `<button data-page="${i}" class="px-3 py-1.5 rounded text-sm transition-colors ${i === page ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}">${i}</button>`;
    }

    if (page < pages) btns += `<button data-page="${page + 1}" class="px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700 transition-colors">Next</button>`;
    pagEl.innerHTML = btns;
    pagEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPage = parseInt((btn as HTMLButtonElement).dataset.page!);
        loadJobs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  } else {
    pagEl.innerHTML = '';
  }

  updateSortIcons();
}

// Sort click handlers
document.querySelectorAll('th[data-sort]').forEach((th) => {
  th.addEventListener('click', () => {
    const col = (th as HTMLElement).dataset.sort!;
    if (currentSort === col) {
      currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
    } else {
      currentSort = col;
      currentOrder = col === 'title' ? 'asc' : 'desc';
    }
    currentPage = 1;
    loadJobs();
  });
});

// Search
document.getElementById('search-input')!.addEventListener(
  'input',
  debounce((e: Event) => {
    currentFilters.q = (e.target as HTMLInputElement).value;
    currentPage = 1;
    loadJobs();
  }, 300)
);

// Filters
document.getElementById('filter-tier')!.addEventListener('change', (e) => {
  currentFilters.tier = (e.target as HTMLSelectElement).value;
  currentPage = 1;
  loadJobs();
});

document.getElementById('filter-type')!.addEventListener('change', (e) => {
  currentFilters.job_type = (e.target as HTMLSelectElement).value;
  currentPage = 1;
  loadJobs();
});

document.getElementById('filter-country')!.addEventListener('change', (e) => {
  currentFilters.country = (e.target as HTMLSelectElement).value;
  currentPage = 1;
  loadJobs();
});

// Page size
document.getElementById('page-size')!.addEventListener('change', (e) => {
  currentLimit = (e.target as HTMLSelectElement).value;
  currentPage = 1;
  loadJobs();
});

async function loadCountries() {
  const data = await api.getOverview();
  const select = document.getElementById('filter-country') as HTMLSelectElement;
  (data.top_countries || []).forEach((c: any) => {
    const opt = document.createElement('option');
    opt.value = c.country;
    opt.textContent = `${c.country} (${c.count})`;
    select.appendChild(opt);
  });
}

loadCountries();
loadJobs();
