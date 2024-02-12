(function() {
    // Sauvegardez la référence originale à la méthode open de XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // Redéfinissez la méthode open pour intercepter les détails de la requête
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._method = method; // Stockez la méthode dans l'instance pour l'utiliser plus tard
        this._url = url; // Stockez l'URL dans l'instance pour l'utiliser plus tard
        return originalOpen.apply(this, [method, url, ...args]);
    };

    // Redéfinissez la méthode send pour ajouter un écouteur d'événements
    XMLHttpRequest.prototype.send = function(...args) {
        // Assurez-vous que l'URL est celle que vous voulez intercepter
        if (this._url.includes("/sales-api/salesApiProfiles/(profileId")) {
            // Ajoutez un écouteur pour l'événement 'load'
            this.addEventListener('load', function() {
                console.log("this.responseType", this.responseType)
                // Vérifiez si la réponse est de type Blob (pour les réponses JSON, elle pourrait être directement en texte)
                if (this.responseType === 'blob' || this.response instanceof Blob) {
                    // Convertissez le Blob en texte pour le traiter comme du JSON
                    const reader = new FileReader();
                    reader.onload = () => {
                        // Utilisez window.postMessage pour communiquer avec le script de contenu
                        window.postMessage({
                            type: "FROM_PAGE",
                            text: reader.result, // Utilisez le résultat du FileReader
                            url: this._url
                        }, "*");
                    };
                    reader.readAsText(this.response);
                } else {
                    // La réponse est déjà en texte, postez-la directement
                    window.postMessage({
                        type: "FROM_PAGE",
                        text: this.responseText,
                        url: this._url
                    }, "*");
                }
            });
        }
        return originalSend.apply(this, args);
    };
})();
