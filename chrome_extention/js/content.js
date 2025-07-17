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