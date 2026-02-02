document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("count");
  const toggleBtn = document.getElementById("toggle");
  const apiUrlInput = document.getElementById("apiUrl");
  const apiKeyInput = document.getElementById("apiKey");
  const saveSettingsBtn = document.getElementById("saveSettings");

  function updateUI(enabled, count) {
    statusEl.textContent = enabled ? "Capturing..." : "Paused";
    statusEl.className = "status " + (enabled ? "on" : "off");
    countEl.textContent = count;
    toggleBtn.textContent = enabled ? "Pause" : "Resume";
  }

  // Get current status
  browser.runtime.sendMessage({ type: "GET_STATUS" }).then(response => {
    updateUI(response.enabled, response.count);
  });

  // Load settings
  browser.runtime.sendMessage({ type: "GET_SETTINGS" }).then(settings => {
    apiUrlInput.value = settings.apiUrl || "http://localhost:8787";
    apiKeyInput.value = settings.apiKey || "";
  });

  // Toggle capture
  toggleBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "TOGGLE" }).then(() => {
      browser.runtime.sendMessage({ type: "GET_STATUS" }).then(status => {
        updateUI(status.enabled, status.count);
      });
    });
  });

  // Save settings
  saveSettingsBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      apiUrl: apiUrlInput.value,
      apiKey: apiKeyInput.value
    }).then(() => {
      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = "Saved!";
      setTimeout(() => { saveSettingsBtn.textContent = originalText; }, 1500);
    });
  });
});
