

// contentScript.js
window.addEventListener("message", function(event) {
    console.log("event", event)
    // Nous ne voulons écouter que les messages envoyés par notre script injecté
    if (event.source == window && event.data.type && event.data.type == "FROM_PAGE") {
        console.log("Données reçues du script injecté:", event.data);

        // Vous pouvez maintenant envoyer ces données au script d'arrière-plan ou les traiter ici
        chrome.runtime.sendMessage({action: "storeProfileData", data: event.data.text, url: event.data.url});
    }
});



const script = document.createElement('script')
script.src = chrome.runtime.getURL('scripts/injectScript.js')
script.type = 'text/javascript';
(document.head || document.body || document.documentElement).appendChild(script);