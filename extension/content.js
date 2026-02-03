// Content script: captures Upwork jobs from BOTH sources
// 1. SSR: extracts from window.__NUXT__ (search results)
// 2. Fetch: intercepts GraphQL responses (feed, recommendations)

(function () {
  "use strict";

  let lastExtracted = "";
  let capturedIds = new Set();

  // ============================================
  // SOURCE 1: Intercept fetch/XHR for GraphQL
  // ============================================
  const injectedCode = `
    (function() {
      console.log("[UpworkInsights] v5 loaded - dual mode (SSR + fetch)");

      // --- Patch fetch ---
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
          let url = "";
          if (typeof args[0] === "string") url = args[0];
          else if (args[0]?.url) url = args[0].url;
          else if (args[0] instanceof Request) url = args[0].url;

          if (url.includes("/api/graphql")) {
            const cloned = response.clone();
            cloned.text().then(text => {
              // Only process if it contains job indicators
              if (text.includes('"ciphertext"') && text.includes('"title"')) {
                let data;
                try { data = JSON.parse(text); } catch(e) { return; }

                // Get alias from URL
                let alias = "unknown";
                try {
                  const m = url.match(/[?&]alias=([^&]+)/);
                  alias = m ? m[1] : "unknown";
                } catch(e) {}

                console.log("[UpworkInsights] FETCH captured jobs, alias:", alias);

                window.postMessage({
                  type: "__UPWORK_JOBS__",
                  source: "fetch",
                  alias: alias,
                  data: data
                }, "*");
              }
            }).catch(() => {});
          }
        } catch(e) {}

        return response;
      };

      // --- Patch XMLHttpRequest ---
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this.__az_url = url;
        return origOpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function(body) {
        const url = this.__az_url || "";
        if (url.includes("/api/graphql")) {
          this.addEventListener("load", function() {
            try {
              const text = this.responseText;
              if (text.includes('"ciphertext"') && text.includes('"title"')) {
                const data = JSON.parse(text);
                let alias = "unknown";
                try {
                  const m = url.match(/[?&]alias=([^&]+)/);
                  alias = m ? m[1] : "unknown";
                } catch(e) {}

                console.log("[UpworkInsights] XHR captured jobs, alias:", alias);

                window.postMessage({
                  type: "__UPWORK_JOBS__",
                  source: "xhr",
                  alias: alias,
                  data: data
                }, "*");
              }
            } catch(e) {}
          });
        }
        return origSend.apply(this, arguments);
      };

      // ============================================
      // SOURCE 2: Extract from __NUXT__ (SSR data)
      // ============================================
      function extractNuxtJobs() {
        try {
          const nuxt = window.__NUXT__;
          if (!nuxt) return;

          function findJobs(obj, depth) {
            if (depth > 12 || !obj || typeof obj !== "object") return [];
            let found = [];

            if (obj.ciphertext && obj.title) return [obj];

            if (Array.isArray(obj)) {
              const jobs = obj.filter(item =>
                item && typeof item === "object" && item.ciphertext && item.title
              );
              if (jobs.length > 0) return jobs;
            }

            const keys = Array.isArray(obj) ? obj.keys() : Object.keys(obj);
            for (const key of keys) {
              try {
                const result = findJobs(obj[key], depth + 1);
                if (result.length > 0) found = found.concat(result);
              } catch(e) {}
            }
            return found;
          }

          const jobs = findJobs(nuxt, 0);
          if (jobs.length > 0) {
            console.log("[UpworkInsights] NUXT extracted", jobs.length, "jobs");
            window.postMessage({
              type: "__UPWORK_JOBS__",
              source: "nuxt-ssr",
              alias: "nuxt-" + window.location.pathname.split("/").pop(),
              data: { jobs: jobs }
            }, "*");
          }
        } catch(e) {
          console.error("[UpworkInsights] NUXT extraction error:", e);
        }
      }

      // Run NUXT extraction after page load
      if (document.readyState === "complete") {
        setTimeout(extractNuxtJobs, 500);
      } else {
        window.addEventListener("load", () => setTimeout(extractNuxtJobs, 1000));
      }

      // Re-extract on SPA navigation
      let currentUrl = location.href;
      new MutationObserver(() => {
        if (location.href !== currentUrl) {
          currentUrl = location.href;
          console.log("[UpworkInsights] Navigation detected, re-extracting...");
          setTimeout(extractNuxtJobs, 1500);
        }
      }).observe(document.body || document.documentElement, { childList: true, subtree: true });

    })();
  `;

  try {
    const script = document.createElement("script");
    script.textContent = injectedCode;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    console.error("[UpworkInsights] Injection failed:", e);
  }

  // ============================================
  // Relay captured data to background script
  // ============================================
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "__UPWORK_JOBS__") return;

    const { source, alias, data } = event.data;

    // Extract jobs array from various response shapes
    let jobs = [];
    if (data.jobs) {
      jobs = data.jobs;
    } else if (data.data) {
      // Check for job detail page (jobAuthDetails)
      const opening = data.data.jobAuthDetails?.opening;
      if (opening?.job?.info?.ciphertext) {
        const info = opening.job.info;
        const ca = opening.clientActivity || {};
        // Build a job object from the detail response, merging clientActivity
        const detailJob = {
          uid: info.id || info.uid,
          ciphertext: info.ciphertext,
          title: info.title || "",
          description: opening.job.description || "",
          createdOn: info.createdOn || opening.job.postedOn,
          publishedOn: opening.job.publishTime || opening.job.publishedOn || info.createdOn,
          type: info.type === "HOURLY" ? 2 : 1,
          durationLabel: opening.job.engagementDuration?.label || null,
          engagement: opening.job.workload || null,
          amount: info.type === "FIXED" ? opening.job.budget : null,
          premium: info.premium || false,
          tierText: opening.job.contractorTier || "",
          isApplied: data.data.jobAuthDetails?.currentUserInfo?.freelancerInfo?.applied != null,
          proposalsTier: null,
          freelancersToHire: ca.numberOfPositionsToHire || 1,
          attrs: (opening.job.sandsData?.ontologySkills || []).map(s => ({
            uid: s.id || s.uid,
            prefLabel: s.prefLabel,
            prettyName: s.prefLabel,
            highlighted: s.relevance === "MANDATORY"
          })),
          hourlyBudget: opening.job.extendedBudgetInfo ? {
            min: opening.job.extendedBudgetInfo.hourlyBudgetMin || 0,
            max: opening.job.extendedBudgetInfo.hourlyBudgetMax || 0
          } : null,
          client: {
            location: { country: data.data.jobAuthDetails?.buyer?.info?.location?.country || "" },
            isPaymentVerified: data.data.jobAuthDetails?.buyer?.isPaymentMethodVerified || false,
            totalSpent: String(data.data.jobAuthDetails?.buyer?.info?.stats?.totalCharges?.amount || 0),
            totalReviews: data.data.jobAuthDetails?.buyer?.info?.stats?.feedbackCount || 0,
            totalFeedback: data.data.jobAuthDetails?.buyer?.info?.stats?.score || 0,
            hasFinancialPrivacy: false
          },
          // Buyer stats
          clientTotalAssignments: data.data.jobAuthDetails?.buyer?.info?.stats?.totalAssignments ?? null,
          clientActiveAssignments: data.data.jobAuthDetails?.buyer?.info?.stats?.activeAssignmentsCount ?? null,
          clientTotalJobsWithHires: data.data.jobAuthDetails?.buyer?.info?.stats?.totalJobsWithHires ?? null,
          clientOpenJobs: data.data.jobAuthDetails?.buyer?.info?.jobs?.openCount ?? null,
          // Job qualifications & metadata
          qualifications: opening.job.qualifications || null,
          segmentationData: opening.job.segmentationData || null,
          tools: opening.job.tools || null,
          qualificationMatches: data.data.jobAuthDetails?.currentUserInfo?.freelancerInfo?.qualificationsMatches || null,
          // Hiring activity fields
          status: opening.job.status || null,
          clientActivity: {
            totalHired: ca.totalHired || 0,
            totalApplicants: ca.totalApplicants || 0,
            totalInvitedToInterview: ca.totalInvitedToInterview || 0,
            invitationsSent: ca.invitationsSent || 0,
            unansweredInvites: ca.unansweredInvites || 0,
            lastBuyerActivity: ca.lastBuyerActivity || null,
            numberOfPositionsToHire: ca.numberOfPositionsToHire || 1
          }
        };
        jobs = [detailJob];
        console.log("[UpworkInsights] Job detail captured:", info.title, "| hired:", ca.totalHired, "| applicants:", ca.totalApplicants);
      } else {
        // Search results - find the jobs array recursively
        const str = JSON.stringify(data.data);
        if (str.includes('"results"')) {
          function findResults(obj) {
            if (!obj || typeof obj !== "object") return null;
            if (obj.results && Array.isArray(obj.results)) return obj.results;
            for (const val of Object.values(obj)) {
              const r = findResults(val);
              if (r) return r;
            }
            return null;
          }
          jobs = findResults(data.data) || [];
        }
      }
    }

    if (jobs.length === 0) {
      console.log("[UpworkInsights] No jobs found in response from", source, alias);
      return;
    }

    // Dedup check (skip dedup for job details with clientActivity - always update)
    const hasActivity = jobs.some(j => j.clientActivity);
    const newJobs = hasActivity ? jobs : jobs.filter(j => {
      const id = j.ciphertext || j.id || j.uid;
      if (capturedIds.has(id)) return false;
      capturedIds.add(id);
      return true;
    });

    if (newJobs.length === 0) {
      console.log("[UpworkInsights] All", jobs.length, "jobs already captured, skipping");
      return;
    }

    console.log("[UpworkInsights] Saving", newJobs.length, "new jobs from", source, "(", alias, ")");

    browser.runtime.sendMessage({
      type: "GRAPHQL_RESPONSE",
      operationName: alias || source,
      data: {
        source: source,
        alias: alias,
        url: window.location.href,
        extractedAt: new Date().toISOString(),
        jobCount: newJobs.length,
        jobs: newJobs
      }
    }).catch(err => console.error("[UpworkInsights] Send failed:", err));
  });
})();
