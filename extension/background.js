// Upwork Insights - GraphQL response interceptor
// Captures job feed data and POSTs to Upwork Insights API

const TARGET_OPERATIONS = [
  "mostRecentJobsFeed",
  "jobSearchQuery",
  "searchJobs",
  "recommendedJobs",
  "bestMatches",
  "jobDetails"
];

let capturedCount = 0;
let isEnabled = true;

const pendingRequests = new Map();

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isEnabled) return;
    if (details.method !== "POST") return;

    try {
      const decoder = new TextDecoder("utf-8");
      const raw = details.requestBody?.raw;
      if (!raw || !raw[0]?.bytes) return;

      const body = JSON.parse(decoder.decode(raw[0].bytes));
      const opName = body.operationName || "";

      const isJobQuery = TARGET_OPERATIONS.some(op =>
        opName.toLowerCase().includes(op.toLowerCase())
      ) || (body.query && /job|search|feed/i.test(body.query));

      if (isJobQuery) {
        pendingRequests.set(details.requestId, {
          operationName: opName,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  },
  { urls: ["*://*.upwork.com/api/graphql*"] },
  ["requestBody"]
);

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isEnabled) return;
    const now = Date.now();
    for (const [id, info] of pendingRequests) {
      if (now - info.timestamp > 30000) {
        pendingRequests.delete(id);
      }
    }
  },
  { urls: ["*://*.upwork.com/*"] }
);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GRAPHQL_RESPONSE") {
    handleGraphQLResponse(message.data, message.operationName);
    sendResponse({ ok: true });
  } else if (message.type === "GET_STATUS") {
    sendResponse({ enabled: isEnabled, count: capturedCount });
  } else if (message.type === "TOGGLE") {
    isEnabled = !isEnabled;
    sendResponse({ enabled: isEnabled });
  } else if (message.type === "GET_SETTINGS") {
    browser.storage.local.get(['apiUrl', 'apiKey']).then(sendResponse);
    return true;
  } else if (message.type === "SAVE_SETTINGS") {
    browser.storage.local.set({ apiUrl: message.apiUrl, apiKey: message.apiKey }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});

async function handleGraphQLResponse(data, operationName) {
  const hasJobs = JSON.stringify(data).includes('"title"') &&
    (JSON.stringify(data).includes('"description"') ||
     JSON.stringify(data).includes('"ciphertext"'));

  if (!hasJobs) return;

  capturedCount++;

  const settings = await browser.storage.local.get(['apiUrl', 'apiKey']);
  const apiUrl = settings.apiUrl || 'http://localhost:8787';

  if (!settings.apiKey) {
    console.warn('[UpworkInsights] No API key configured - set it in extension settings');
    browser.browserAction.setBadgeText({ text: 'KEY' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#ff9800' });
    return;
  }

  try {
    const response = await fetch(apiUrl + '/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.apiKey,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('[UpworkInsights] Sent', result.inserted, 'jobs');

    browser.browserAction.setBadgeText({ text: String(capturedCount) });
    browser.browserAction.setBadgeBackgroundColor({ color: '#4CAF50' });
  } catch (err) {
    console.error('[UpworkInsights] POST failed:', err);
    browser.browserAction.setBadgeText({ text: '!' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#f44336' });
  }
}
