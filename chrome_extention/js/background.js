// Initialize default apiUrl in chrome.storage.local

var cachedApiUrl = "http://127.0.0.1:8485/data";
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("apiUrl", (result) => {
    if (!result.apiUrl) {
      chrome.storage.local.set({ apiUrl: cachedApiUrl }, () => {
        console.log("Default apiUrl set.");
      });
    }
    else {
        cachedApiUrl = result.apiUrl;
    }
  });
});

// Listen to messages from content.js or popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_HTTP") {
    fetch(cachedApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({data: message.data})
        })
        .then(response => response.text())
        .then(responseData => {
            console.log("Response from API:", responseData);
        })
        .catch(error => {
            console.error("Error during API request:", error);
        });
    return true; // Keep the message channel open for async response
  }

  else if (message.type === "SET_API_URL") {
    // Update apiUrl in chrome.storage.local
    cachedApiUrl = message.apiUrl;
    chrome.storage.local.set({ apiUrl: message.apiUrl }, () => {
      console.log("apiUrl updated to:", message.apiUrl);
      sendResponse({ success: true });
    });
    return true;
  }
});
