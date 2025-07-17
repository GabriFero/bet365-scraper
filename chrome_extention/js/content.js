function injectJs(href, callback){
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.src = href;
    script.onload = callback;
    document.body.appendChild(script);
}

injectJs(chrome.runtime.getURL("js/hook.js"));
injectJs(chrome.runtime.getURL("js/iframe-manager.js"));



window.addEventListener("sendToAPI", async Ot => {
    chrome.runtime.sendMessage({ type: "SEND_HTTP", data: Ot.detail});
})

// Gestisci messaggi dal popup per iframe
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TOGGLE_IFRAME_SCRAPING") {
        console.log('[Content] Forwarding iframe toggle to page:', message);
        
        // Invia messaggio alla pagina
        window.postMessage({
            type: 'TOGGLE_IFRAME_SCRAPING',
            enabled: message.enabled,
            sport: message.sport
        }, '*');
        
        sendResponse({ success: true });
        return true;
    }
    
    else if (message.type === "GET_IFRAME_STATUS") {
        // Richiedi stato iframe dalla pagina
        window.postMessage({
            type: 'GET_IFRAME_STATUS'
        }, '*');
        
        // Ascolta risposta dalla pagina
        const responseHandler = (event) => {
            if (event.data.type === 'IFRAME_STATUS_RESPONSE') {
                window.removeEventListener('message', responseHandler);
                sendResponse(event.data.status);
            }
        };
        
        window.addEventListener('message', responseHandler);
        
        // Timeout dopo 5 secondi
        setTimeout(() => {
            window.removeEventListener('message', responseHandler);
            sendResponse({ activeIframes: 0 });
        }, 5000);
        
        return true;
    }
});