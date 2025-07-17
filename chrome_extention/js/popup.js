// Stato del multi-tab scraper
let multiTabEnabled = false;
let currentSport = 1;

// Load the current apiUrl into the input field
document.addEventListener("DOMContentLoaded", () => {
  const apiUrlInput = document.getElementById("apiUrl");
  const saveBtn = document.getElementById("saveBtn");
  const multiTabBtn = document.getElementById("multiTabBtn");
  const statusDiv = document.getElementById("status");
  const sportRadios = document.querySelectorAll('input[name="sport"]');

  // Carica configurazione salvata
  chrome.storage.local.get(["apiUrl", "multiTabEnabled", "currentSport"], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
    
    multiTabEnabled = result.multiTabEnabled || false;
    currentSport = result.currentSport || 1;
    
    // Imposta sport selezionato
    sportRadios.forEach(radio => {
      if (radio.value == currentSport) {
        radio.checked = true;
      }
    });
    
    updateUI();
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
        
        updateUI();
      }
    });
  });

  // Aggiorna stato ogni 5 secondi se multi-tab e attivo
  setInterval(() => {
    if (multiTabEnabled) {
      updateStatus();
    }
  }, 5000);

  function updateUI() {
    if (multiTabEnabled) {
      multiTabBtn.textContent = "Stop Multi-Scraping";
      multiTabBtn.style.backgroundColor = "#ff4444";
      statusDiv.textContent = `Status: Active (Sport: ${getSportName(currentSport)})`;
    } else {
      multiTabBtn.textContent = "Start Multi-Scraping";
      multiTabBtn.style.backgroundColor = "#4CAF50";
      statusDiv.textContent = "Status: Disabled";
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
});