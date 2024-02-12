chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "storeProfileData") {
    console.log("Données de profil reçues:", request.data);
    console.log("URL de la requête:", request.url);

    try {
      // Tentez de parser les données JSON
      const parsedData = JSON.parse(request.data);

      // Enregistrez les données parsées dans chrome.storage
      chrome.storage.local.set({profileData: parsedData}, function() {
          console.log("Données du profil stockées.");
      });
    } catch (error) {
      console.error("Erreur lors du parsing des données JSON:", error);
    }
  }
});
