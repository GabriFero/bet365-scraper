// Initialize default apiUrl in chrome.storage.local
var cachedApiUrl = "http://127.0.0.1:8485/data";

// Mappa per tenere traccia delle tab create per multi-scraping
const multiScrapingTabs = new Map(); // eventId -> tabId
let multiTabEnabled = false;
let currentSport = 1;
let updateInterval = null;

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
    // Prepara il payload con informazioni aggiuntive
    const payload = {
      data: message.data,
      eventId: message.eventId || null,
      source: message.source || 'main',
      timestamp: new Date().toISOString(),
      tabId: sender.tab ? sender.tab.id : null
    };

    fetch(cachedApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.text())
        .then(responseData => {
            console.log(`[${payload.source}] Response from API:`, responseData);
            if (payload.eventId) {
              console.log(`[tab-${payload.eventId}] Data sent successfully`);
            }
        })
        .catch(error => {
            console.error(`[${payload.source}] Error during API request:`, error);
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

  else if (message.type === "TOGGLE_MULTI_TAB") {
    multiTabEnabled = message.enabled;
    currentSport = message.sport;
    
    console.log(`[MultiTab] Multi-tab ${multiTabEnabled ? 'ENABLED' : 'DISABLED'} for sport ${currentSport}`);
    
    if (multiTabEnabled) {
      startMultiTab();
    } else {
      stopMultiTab();
    }
    
    sendResponse({ success: true });
    return true;
  }

  else if (message.type === "GET_MULTI_TAB_STATUS") {
    sendResponse({ 
      activeTabs: multiScrapingTabs.size,
      tabIds: Array.from(multiScrapingTabs.values())
    });
    return true;
  }
});

async function startMultiTab() {
  console.log('[MultiTab] Starting multi-tab monitoring...');
  
  // Ferma il precedente interval se esiste
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Avvia il primo controllo
  await updateTabs();
  
  // Imposta controllo periodico ogni 30 secondi
  updateInterval = setInterval(updateTabs, 30000);
}

function stopMultiTab() {
  console.log('[MultiTab] Stopping multi-tab monitoring...');
  
  // Ferma il controllo periodico
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  
  // Chiudi tutte le tab attive
  for (const [eventId, tabId] of multiScrapingTabs) {
    chrome.tabs.remove(tabId, () => {
      if (chrome.runtime.lastError) {
        console.error(`[MultiTab] Error closing tab ${tabId}:`, chrome.runtime.lastError);
      } else {
        console.log(`[MultiTab] Tab ${tabId} closed for event ${eventId}`);
      }
    });
  }
  
  multiScrapingTabs.clear();
}

async function updateTabs() {
  if (!multiTabEnabled) return;
  
  try {
    // Ottieni eventi live dal server locale
    const response = await fetch(`http://127.0.0.1:8485/live?sport=${currentSport}`);
    const events = await response.json();
    
    console.log(`[MultiTab] Found ${events.length} live events`);
    
    const currentEventIds = new Set(events.map(e => e.web_page_id).filter(Boolean));
    const activeEventIds = new Set(multiScrapingTabs.keys());
    
    // Chiudi tab per eventi non piu live
    for (const eventId of activeEventIds) {
      if (!currentEventIds.has(eventId)) {
        console.log(`[MultiTab] Event ${eventId} no longer live, closing tab`);
        const tabId = multiScrapingTabs.get(eventId);
        if (tabId) {
          chrome.tabs.remove(tabId);
          multiScrapingTabs.delete(eventId);
        }
      }
    }
    
    // Apri tab per nuovi eventi (max 10 tab simultanee)
    const maxTabs = 10;
    const newEvents = events.filter(e => {
      return e.web_page_id && !activeEventIds.has(e.web_page_id);
    }).slice(0, maxTabs - multiScrapingTabs.size);
    
    for (const event of newEvents) {
      await createTabForEvent(event);
      // Pausa di 2 secondi tra aperture tab
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`[MultiTab] Update complete. Active tabs: ${multiScrapingTabs.size}`);
    
  } catch (error) {
    console.error('[MultiTab] Error updating tabs:', error);
  }
}

async function createTabForEvent(event) {
  const eventId = event.web_page_id;
  const eventUrl = buildEventUrl(event);
  
  if (!eventUrl) {
    console.warn(`[MultiTab] Cannot build URL for event ${eventId}`);
    return;
  }

  console.log(`[MultiTab] Creating tab for event ${eventId}: ${event.event}`);
  console.log(`[MultiTab] Built URL for event ${eventId}:`, eventUrl);
  
  try {
    chrome.tabs.create({
      url: eventUrl,
      active: false, // Non attivare la tab
      pinned: false
    }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error(`[MultiTab] Error creating tab:`, chrome.runtime.lastError);
        return;
      }
      
      // Salva riferimento alla tab
      multiScrapingTabs.set(eventId, tab.id);
      
      console.log(`[MultiTab] Tab created successfully: ${tab.id} for event ${eventId}`);
    });
    
  } catch (error) {
    console.error(`[MultiTab] Error creating tab for event ${eventId}:`, error);
  }
}

function buildEventUrl(event) {
  // Ottieni l'URL base dalla tab corrente di Bet365
  // Per ora usiamo un URL base, ma potremmo migliorarlo
  const baseUrl = 'https://www.bet365.it';
  const eventId = event.web_page_id;
  
  // Costruisci URL finale
  const url = `${baseUrl}/#/IP/${eventId}`;
  
  console.log(`[MultiTab] Built URL for event ${eventId}:`, url);
  return url;
}

// Cleanup quando le tab vengono chiuse manualmente
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Rimuovi dalla mappa se era una tab di multi-scraping
  for (const [eventId, storedTabId] of multiScrapingTabs.entries()) {
    if (storedTabId === tabId) {
      console.log(`[MultiTab] Tab ${tabId} for event ${eventId} was closed manually`);
      multiScrapingTabs.delete(eventId);
      break;
    }
  }
});