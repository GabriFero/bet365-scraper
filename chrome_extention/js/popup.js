// Stato del multi-tab scraper
let multiTabEnabled = false;
let iframeEnabled = false;
let currentSport = 1;

// Load the current apiUrl into the input field
document.addEventListener("DOMContentLoaded", () => {
  const apiUrlInput = document.getElementById("apiUrl");
  const saveBtn = document.getElementById("saveBtn");
  const multiTabBtn = document.getElementById("multiTabBtn");
  const statusDiv = document.getElementById("status");
  const iframeBtn = document.getElementById("iframeBtn");
  const iframeStatusDiv = document.getElementById("iframeStatus");
  const sportRadios = document.querySelectorAll('input[name="sport"]');

  // Carica configurazione salvata
  chrome.storage.local.get(["apiUrl", "multiTabEnabled", "iframeEnabled", "currentSport"], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
    
    multiTabEnabled = result.multiTabEnabled || false;
    iframeEnabled = result.iframeEnabled || false;
    currentSport = result.currentSport || 1;
    
    // Imposta sport selezionato
    sportRadios.forEach(radio => {
      if (radio.value == currentSport) {
        radio.checked = true;
      }
    });
    
    updateUI();
    updateIframeUI();
  });

  // Salva URL API
  saveBtn.addEventListener('click', function() {
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

  // Toggle multi-tab scraper
  multiTabBtn.addEventListener('click', function() {
    multiTabEnabled = !multiTabEnabled;
    
    // Salva stato
    chrome.storage.local.set({ 
      multiTabEnabled: multiTabEnabled,
      currentSport: currentSport 
    });
    
    // Invia comando al background script
    chrome.runtime.sendMessage({
      type: "TOGGLE_MULTI_TAB",
      enabled: multiTabEnabled,
      sport: currentSport
    });
    
    updateUI();
  });

  // Toggle iframe scraper
  iframeBtn.addEventListener('click', function() {
    // Disabilita multi-tab se iframe viene attivato
    if (!iframeEnabled && multiTabEnabled) {
      multiTabEnabled = false;
      chrome.runtime.sendMessage({
        type: "TOGGLE_MULTI_TAB",
        enabled: false,
        sport: currentSport
      });
    }
    
    iframeEnabled = !iframeEnabled;
    
    // Salva stato
    chrome.storage.local.set({ 
      iframeEnabled: iframeEnabled,
      multiTabEnabled: multiTabEnabled,
      currentSport: currentSport 
    });
    
    // Invia comando alla pagina attiva
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('bet365')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TOGGLE_IFRAME_SCRAPING",
          enabled: iframeEnabled,
          sport: currentSport
        });
      }
    });
    
    updateUI();
    updateIframeUI();
  });

  // Cambio sport
  sportRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        currentSport = parseInt(this.value);
        chrome.storage.local.set({ currentSport: currentSport });
        
        // Se multi-tab e attivo, riavvia con nuovo sport
        if (multiTabEnabled) {
          chrome.runtime.sendMessage({
            type: "TOGGLE_MULTI_TAB",
            enabled: true,
            sport: currentSport
          });
        }
        
        // Se iframe e attivo, riavvia con nuovo sport
        if (iframeEnabled) {
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('bet365')) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: "TOGGLE_IFRAME_SCRAPING",
                enabled: true,
                sport: currentSport
              });
            }
          });
        }
        
        updateUI();
        updateIframeUI();
      }
    });
  });

  // Aggiorna stato ogni 5 secondi se multi-tab o iframe e attivo
  setInterval(() => {
    if (multiTabEnabled) {
      updateStatus();
    }
    if (iframeEnabled) {
      updateIframeStatus();
    }
  }, 5000);

  function updateUI() {
    if (multiTabEnabled) {
      multiTabBtn.textContent = "Stop Multi-Tab Scraping";
      multiTabBtn.style.backgroundColor = "#ff4444";
      statusDiv.textContent = `Status: Active (Sport: ${getSportName(currentSport)})`;
    } else {
      multiTabBtn.textContent = "Start Multi-Tab Scraping";
      multiTabBtn.style.backgroundColor = "#4CAF50";
      statusDiv.textContent = "Status: Disabled";
    }
  }

  function updateIframeUI() {
    if (iframeEnabled) {
      iframeBtn.textContent = "Stop Iframe Scraping";
      iframeBtn.style.backgroundColor = "#ff4444";
      iframeStatusDiv.textContent = `Status: Active (Sport: ${getSportName(currentSport)})`;
    } else {
      iframeBtn.textContent = "Start Iframe Scraping";
      iframeBtn.style.backgroundColor = "#4CAF50";
      iframeStatusDiv.textContent = "Status: Disabled";
    }
  }

  function getSportName(sport) {
    switch(sport) {
      case 1: return "Football";
      case 18: return "Basketball";
      case 13: return "Tennis";
      default: return "Unknown";
    }
  }

  function updateStatus() {
    // Richiedi stato dal background script
    chrome.runtime.sendMessage({
      type: "GET_MULTI_TAB_STATUS"
    }, (response) => {
      if (response && response.activeTabs !== undefined) {
        statusDiv.textContent = `Status: Active (${response.activeTabs} tabs, Sport: ${getSportName(currentSport)})`;
      }
    });
  }

  function updateIframeStatus() {
    // Richiedi stato dal content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('bet365')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "GET_IFRAME_STATUS"
        }, (response) => {
          if (response && response.activeIframes !== undefined) {
            iframeStatusDiv.textContent = `Status: Active (${response.activeIframes} iframes, Sport: ${getSportName(currentSport)})`;
          }
        });
      }
    });
  }
});