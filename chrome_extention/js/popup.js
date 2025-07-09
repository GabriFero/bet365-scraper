


// Load the current apiUrl into the input field
document.addEventListener("DOMContentLoaded", () => {
  const apiUrlInput = document.getElementById("apiUrl");

  // Get current apiUrl from chrome.storage.local
  chrome.storage.local.get(["apiUrl"], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
  });

  document.getElementById('saveBtn').addEventListener('click', function() {
    const newApiUrl = apiUrlInput.value.trim();
    if (!newApiUrl) {
      alert("Please enter a valid API URL.");
      return;
    }
    chrome.runtime.sendMessage(
          { type: "SET_API_URL", apiUrl: newApiUrl },
          (response) => {
            if (response && response.success) {
              alert("API URL updated successfully.");
            } else {
              alert("Failed to update API URL.");
            }
          }
        );
    });

});
