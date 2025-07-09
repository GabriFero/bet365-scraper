

function wrap(obj, meth) {
   var orig = obj[meth];
   obj[meth] = function wrapper() {
       window.dispatchEvent(new CustomEvent('sendToAPI', { detail: arguments[0] }));
       return orig.apply(this, arguments);
   }
}

function hookSocket(){
    if(window.readit){
        wrap(window.readit.WebsocketTransportMethod.prototype, 'socketDataCallback');
    }
    else {
        setTimeout(hookSocket, 1000);
    }
}

setTimeout(hookSocket, 1000);

