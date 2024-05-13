chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "storeProfilesData") {
    console.log("Données de profil reçues:", request.data);
    console.log("URL de la requête:", request.url);

    try {
      // Tentez de parser les données JSON
      const parsedData = JSON.parse(request.data);
      console.log("parsedData", parsedData);

      // Enregistrez les données parsées dans chrome.storage
      chrome.storage.local.set({ profilesData: parsedData }, function () {
        console.log("Données du profil stockées.");
      });
    } catch (error) {
      console.error("Erreur lors du parsing des données JSON:", error);
    }
  }

  console.log("request.action", request.action);
  if (request.action === "storeProfileData") {
    console.log("Données de profil reçues:", request.data);
    console.log("URL de la requête:", request.url);

    chrome.storage.local.get("profileData", async function (data) {
      const pastData = data.profileData;
      console.log("pastData", pastData)

      try {
        // Tentez de parser les données JSON
        const parsedData = JSON.parse(request.data);
        console.log("parsedData", parsedData);

        // Enregistrez les données parsées dans chrome.storage
        chrome.storage.local.set(
          { profileData: pastData ? { ...pastData, ...parsedData } : parsedData },
          function () {
            console.log("Données du profil stockées.");
          }
        );
      } catch (error) {
        console.error("Erreur lors du parsing des données JSON:", error);
      }
    });
  }
});
