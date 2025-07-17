/**
 * Iframe Manager per Bet365
 * Usa iframe nascosti per ottenere dati WebSocket da più eventi simultaneamente
 * Alternativa più efficiente alle tab multiple
 */

class IframeManager {
    constructor() {
        this.activeIframes = new Map(); // eventId -> iframe element
        this.maxConcurrentIframes = 15; // Più iframe rispetto alle tab
        this.checkInterval = 30000; // 30 secondi tra i controlli
        this.isEnabled = false;
        this.currentSport = null;
        this.sessionParams = null;
        this.iframeContainer = null;
        
        this.init();
    }

    init() {
        console.log('[IframeManager] Initializing Iframe Manager');
        
        // Crea container nascosto per gli iframe
        this.createIframeContainer();
        
        // Estrai parametri sessione dall'URL corrente
        this.extractSessionParams();
        
        // Ascolta messaggi dal popup
        window.addEventListener('message', (event) => {
            if (event.data.type === 'TOGGLE_IFRAME_SCRAPING') {
                console.log('[IframeManager] Received toggle message:', event.data);
                this.toggleIframeScraping(event.data.enabled, event.data.sport);
            }
            else if (event.data.type === 'GET_IFRAME_STATUS') {
                console.log('[IframeManager] Received status request');
                // Invia risposta con stato corrente
                window.postMessage({
                    type: 'IFRAME_STATUS_RESPONSE',
                    status: this.getStatus()
                }, '*');
            }
        });

        // Controlla periodicamente se ci sono nuovi eventi
        setInterval(() => {
            if (this.isEnabled) {
                this.updateIframes();
            }
        }, this.checkInterval);
    }

    createIframeContainer() {
        // Crea un container nascosto per gli iframe
        this.iframeContainer = document.createElement('div');
        this.iframeContainer.id = 'bet365-iframe-container';
        this.iframeContainer.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
            visibility: hidden;
            pointer-events: none;
            z-index: -1;
        `;
        document.body.appendChild(this.iframeContainer);
        console.log('[IframeManager] Iframe container created');
    }

    extractSessionParams() {
        const url = window.location.href;
        console.log('[IframeManager] Current URL:', url);
        
        // Estrai parametri _h e btsffd se presenti
        const urlParams = new URLSearchParams(window.location.search);
        const hashParam = urlParams.get('_h');
        const btsffdParam = urlParams.get('btsffd');
        
        if (hashParam || btsffdParam) {
            this.sessionParams = {
                _h: hashParam,
                btsffd: btsffdParam
            };
            console.log('[IframeManager] Session params extracted:', this.sessionParams);
        } else {
            console.log('[IframeManager] No session params found, using base URLs');
        }
    }

    toggleIframeScraping(enabled, sport = 1) {
        this.isEnabled = enabled;
        this.currentSport = sport;
        
        console.log(`[IframeManager] Iframe scraping ${enabled ? 'ENABLED' : 'DISABLED'} for sport ${sport}`);
        
        if (enabled) {
            this.startIframeScraping();
        } else {
            this.stopIframeScraping();
        }
    }

    async startIframeScraping() {
        console.log('[IframeManager] Starting iframe scraping...');
        console.log('[IframeManager] Current sport:', this.currentSport);
        console.log('[IframeManager] Fetching from:', `http://127.0.0.1:8485/live?sport=${this.currentSport}`);
        
        try {
            const response = await fetch(`http://127.0.0.1:8485/live?sport=${this.currentSport}`);
            console.log('[IframeManager] Fetch response status:', response.status);
            
            const events = await response.json();
            console.log('[IframeManager] Raw events data:', events);
            console.log(`[IframeManager] Found ${events.length} live events`);
            
            // Crea iframe per ogni evento (limitato dal maxConcurrentIframes)
            const eventsToProcess = events.slice(0, this.maxConcurrentIframes);
            console.log('[IframeManager] Events to process:', eventsToProcess.length);
            
            for (const event of eventsToProcess) {
                const eventId = event.web_page_id;
                console.log('[IframeManager] Processing event:', event.event, 'ID:', eventId);
                
                if (eventId && !this.activeIframes.has(eventId)) {
                    console.log('[IframeManager] Creating iframe for event:', eventId);
                    await this.createIframeForEvent(event);
                    // Piccola pausa tra creazioni iframe
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.log('[IframeManager] Skipping event (no ID or already exists):', eventId);
                }
            }
            
            console.log('[IframeManager] Iframe creation complete. Active iframes:', this.activeIframes.size);
            
        } catch (error) {
            console.error('[IframeManager] Error fetching live events:', error);
        }
    }

    stopIframeScraping() {
        console.log('[IframeManager] Stopping iframe scraping...');
        
        // Rimuovi tutti gli iframe attivi
        for (const [eventId, iframe] of this.activeIframes) {
            this.removeIframe(eventId);
        }
        
        this.activeIframes.clear();
    }

    async createIframeForEvent(event) {
        const eventId = event.web_page_id;
        const eventUrl = this.buildEventUrl(event);
        
        if (!eventUrl) {
            console.warn(`[IframeManager] Cannot build URL for event ${eventId}`);
            return;
        }

        console.log(`[IframeManager] Creating iframe for event ${eventId}: ${event.event}`);
        console.log(`[IframeManager] Built URL for event ${eventId}:`, eventUrl);
        
        try {
            // Crea iframe
            const iframe = document.createElement('iframe');
            iframe.id = `iframe-${eventId}`;
            iframe.src = eventUrl;
            iframe.style.cssText = `
                width: 1px;
                height: 1px;
                border: none;
                visibility: hidden;
                position: absolute;
                top: -9999px;
                left: -9999px;
            `;
            
            // Aggiungi al container
            this.iframeContainer.appendChild(iframe);
            
            // Salva riferimento
            this.activeIframes.set(eventId, {
                iframe: iframe,
                url: eventUrl,
                eventName: event.event,
                created: Date.now()
            });
            
            console.log(`[IframeManager] Iframe created successfully for event ${eventId}`);
            
            // Gestisci eventi iframe
            iframe.onload = () => {
                console.log(`[IframeManager] Iframe loaded for event ${eventId}`);
                
                // Prova a iniettare lo script hook nell'iframe
                try {
                    this.injectHookIntoIframe(iframe, eventId);
                } catch (error) {
                    console.warn(`[IframeManager] Could not inject hook into iframe ${eventId}:`, error);
                }
            };
            
            iframe.onerror = () => {
                console.error(`[IframeManager] Error loading iframe for event ${eventId}`);
                this.removeIframe(eventId);
            };
            
        } catch (error) {
            console.error(`[IframeManager] Error creating iframe for event ${eventId}:`, error);
        }
    }

    injectHookIntoIframe(iframe, eventId) {
        try {
            // Prova ad accedere al documento dell'iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if (iframeDoc) {
                // Crea script hook personalizzato per questo iframe
                const script = iframeDoc.createElement('script');
                script.textContent = `
                    // Hook WebSocket personalizzato per iframe ${eventId}
                    (function() {
                        const originalWebSocket = window.WebSocket;
                        window.WebSocket = function(url, protocols) {
                            const ws = new originalWebSocket(url, protocols);
                            
                            const originalOnMessage = ws.onmessage;
                            ws.onmessage = function(event) {
                                // Invia dati al parent window
                                try {
                                    window.parent.postMessage({
                                        type: 'IFRAME_WEBSOCKET_DATA',
                                        eventId: '${eventId}',
                                        data: event.data,
                                        source: 'iframe-${eventId}'
                                    }, '*');
                                } catch (e) {
                                    console.error('Error sending iframe data:', e);
                                }
                                
                                // Chiama handler originale
                                if (originalOnMessage) {
                                    originalOnMessage.call(this, event);
                                }
                            };
                            
                            return ws;
                        };
                        
                        console.log('[IframeHook] WebSocket hook injected for event ${eventId}');
                    })();
                `;
                
                iframeDoc.head.appendChild(script);
                console.log(`[IframeManager] Hook script injected into iframe ${eventId}`);
            }
        } catch (error) {
            console.warn(`[IframeManager] Cannot inject hook into iframe ${eventId} (CORS):`, error);
        }
    }

    buildEventUrl(event) {
        const baseUrl = window.location.origin;
        const eventId = event.web_page_id;
        
        // Costruisci URL con parametri sessione se disponibili
        let url = baseUrl;
        
        if (this.sessionParams) {
            const params = new URLSearchParams();
            if (this.sessionParams._h) {
                params.append('_h', this.sessionParams._h);
            }
            if (this.sessionParams.btsffd) {
                params.append('btsffd', this.sessionParams.btsffd);
            }
            url += '?' + params.toString();
        }
        
        // Aggiungi hash con evento specifico
        url += `#/IP/${eventId}`;
        
        console.log(`[IframeManager] Built URL for event ${eventId}:`, url);
        return url;
    }

    removeIframe(eventId) {
        const iframeInfo = this.activeIframes.get(eventId);
        if (iframeInfo && iframeInfo.iframe) {
            console.log(`[IframeManager] Removing iframe for event ${eventId}`);
            
            try {
                this.iframeContainer.removeChild(iframeInfo.iframe);
            } catch (error) {
                console.warn(`[IframeManager] Error removing iframe ${eventId}:`, error);
            }
            
            this.activeIframes.delete(eventId);
        }
    }

    async updateIframes() {
        if (!this.isEnabled) return;
        
        try {
            // Ottieni eventi live aggiornati
            const response = await fetch(`http://127.0.0.1:8485/live?sport=${this.currentSport}`);
            const currentEvents = await response.json();
            
            const currentEventIds = new Set(currentEvents.map(e => e.web_page_id).filter(Boolean));
            const activeEventIds = new Set(this.activeIframes.keys());
            
            // Rimuovi iframe per eventi non più live
            for (const eventId of activeEventIds) {
                if (!currentEventIds.has(eventId)) {
                    console.log(`[IframeManager] Event ${eventId} no longer live, removing iframe`);
                    this.removeIframe(eventId);
                }
            }
            
            // Crea iframe per nuovi eventi
            const newEvents = currentEvents.filter(e => {
                const eventId = e.web_page_id;
                return eventId && !activeEventIds.has(eventId);
            }).slice(0, this.maxConcurrentIframes - this.activeIframes.size);
            
            for (const event of newEvents) {
                await this.createIframeForEvent(event);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log(`[IframeManager] Update complete. Active iframes: ${this.activeIframes.size}`);
            
        } catch (error) {
            console.error('[IframeManager] Error updating iframes:', error);
        }
    }

    getStatus() {
        return {
            enabled: this.isEnabled,
            sport: this.currentSport,
            activeIframes: this.activeIframes.size,
            maxConcurrent: this.maxConcurrentIframes,
            sessionParams: this.sessionParams
        };
    }
}

// Inizializza il manager solo se siamo sulla pagina principale di Bet365
if (window.location.href.includes('bet365') && window.top === window.self) {
    window.iframeManager = new IframeManager();
    
    // Ascolta dati WebSocket dagli iframe
    window.addEventListener('message', (event) => {
        if (event.data.type === 'IFRAME_WEBSOCKET_DATA') {
            console.log(`[IframeManager] Received WebSocket data from iframe ${event.data.eventId}`);
            
            // Invia i dati al server come se fossero dalla pagina principale
            const customEvent = new CustomEvent('sendToAPI', {
                detail: event.data.data
            });
            window.dispatchEvent(customEvent);
        }
    });
    
    console.log('[IframeManager] Iframe Manager initialized');
}