const RECRUITER_ID = "658d514d8dac71a7830670c8";
const HUNTMELEADS_LIST_ID = "65c737f13f3cf581098b45e6";
const WAITING_TIME_BETWEEN_PAGNIATION = 30000; // 30 secondes
const WAITING_TIME_BEFORE_DOWNLOAD = 120000; // 2 minutes

let email_priority = "all"; // Par défaut, prioriser les emails personnels
let stopPagination = false; // Variable de contrôle pour arrêter la pagination
let currentPage = 1;
let lastSendToHuntMeLeadsTime = 0;
let lastPageChangeTime = 0;

function createAndManageModal() {

  const modalBackground = document.createElement("div");
  modalBackground.className = "modal-background";
  document.body.appendChild(modalBackground);

  const modal = document.createElement("div");
  modal.id = "list-modal";
  modal.style.display = "none"; // Masquer la modal par défaut
  document.body.appendChild(modal);

  modal.innerHTML = `
  <img src="" style="width: 100px; height: 100px; display: none;" id="loader" />
  <div id="content-modal-compagnon">
    <h2 class="compagnon-title" >Récupération des profils</h2>
    <div style="font-size: 12px; margin-top: 5px;" ><span id="retrieval-status-message">Page actuelle: ${currentPage}</span></div>
    <form>
      <div class="compagnon-radio">
        <input type="radio" id="b2c" name="email_priority" value="B2C" checked>
        <label for="b2c">Prioriser emails personnels</label>
      </div>
      <div class="compagnon-radio">
        <input type="radio" id="b2b" name="email_priority" value="B2B">
        <label for="b2b">Prioriser emails professionnels</label>
      </div>
      <div class="compagnon-radio">
        <input type="radio" id="all" name="email_priority" value="all">
        <label for="all">Prendre toutes les adresses emails</label>
      </div>
    </form>
    <img src="" style="width: 150px; height: auto; display: none; margin-left: 20px; margin-top: 20px; margin-bottom: 30px;" id="loader-2" />
    <div style="display: flex; flex-direction: column; align-items: center; margin-top: 10px; width: 100%;">
    <img type="button" id="close-modal" style="position: absolute; top: 10px; left: 10px; height: 25px; width: 25px; cursor: pointer;" />
      <button style="margin-top: 20px; padding: 15px 30px; font-size: 16px;" type="button" class="compagnon-button" id="start-retrieval">Lancer la récupération</button>
      <button style="margin-top: 20px; display: none;" type="button" class="compagnon-button-second" id="stop-retrieval">Arrêter la récupération</button>
    </div>
  </div>
  `;

  document.getElementById("loader-2").src = chrome.runtime.getURL("loader_2.gif");
  document.getElementById("loader").src = chrome.runtime.getURL("loader.gif");
  document.getElementById("close-modal").src = chrome.runtime.getURL("close.png");

  // Gestion du choix de priorité d'email
  document.querySelectorAll('input[name="email_priority"]').forEach((input) => {
    input.addEventListener("change", () => {
      email_priority = input.value;
    });
  });

  // Bouton de lancement/arrêt de la récupération
  const startRetrievalButton = document.getElementById("start-retrieval");
  const stopRetrievalButton = document.getElementById("stop-retrieval");
  const radios = document.getElementsByClassName("compagnon-radio");

  startRetrievalButton.addEventListener("click", async () => {

    stopPagination = false; // Bascule l'état de stopPagination
    document.getElementById("close-modal").style.display = "none"; // Cache le bouton Fermer
    startRetrievalButton.style.display = "none";
    stopRetrievalButton.style.display = "block";
    radios[0].style.display = "none";
    radios[1].style.display = "none";
    radios[2].style.display = "none";

    document.getElementById("loader-2").style.display = "block"; // Afficher le loader

    await new Promise((resolve) => setTimeout(resolve, 4000)); // Attendre 4 secondes
    launchProfileRetrieval();
  });

  stopRetrievalButton.addEventListener("click", () => {
    stopPagination = true; // Bascule l'état de stopPagination
    startRetrievalButton.style.display = "block";
    stopRetrievalButton.style.display = "none";
    radios[0].style.display = "block";
    radios[1].style.display = "block";
    radios[2].style.display = "block";
    document.getElementById("loader-2").style.display = "none"; // Afficher le loader
    document.getElementById("loader").style.display = "none"; // Afficher le loader
    stopProfileRetrieval();
    document.getElementById("close-modal").style.display = "block"; // Cache le bouton Fermer
  });

  // Bouton de fermeture de la modal
  const closeModalButton = document.getElementById("close-modal");
  closeModalButton.addEventListener("click", () => {
    modal.style.display = "none";
    modalBackground.style.display = "none";
    document.getElementById("loader-2").style.display = "none"; // Afficher le loader
    document.getElementById("job-critera-modal").style.display = "none";
    stopPagination = true;
  });
  
}

const stopProfileRetrieval = () => {
  const currentTime = Date.now();
  const timeElapsedSinceLastSend = currentTime - lastSendToHuntMeLeadsTime;
  const waitTime = WAITING_TIME_BEFORE_DOWNLOAD - timeElapsedSinceLastSend; // 20 secondes - temps écoulé

  if (waitTime > 0) {
    // Moins de 20 secondes se sont écoulées depuis la dernière exécution
    showLoaderWithDelay(waitTime);
  } else {
    // 20 secondes ou plus se sont écoulées, procéder immédiatement
    downloadCSV();
  }
};

const showLoaderWithDelay = (delay) => {
  document.getElementById("loader").style.display = "block"; // Afficher le loader
  document.getElementById("content-modal-compagnon").style.display = "none";
  document.getElementById("job-critera-modal").style.display = "none";

  setTimeout(() => {
    // Le délai est écoulé, procéder au téléchargement du CSV
    downloadCSV();
  }, delay);
};

const downloadCSV = () => {
  fetch(
    `https://your-server-url.com/api/compagnon/download-csv/${RECRUITER_ID}?email_priority=${email_priority}`
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to download CSV");
      }
      return res.blob();
    })
    .then((blob) => {
      // Créer une URL pour le blob
      const downloadButton = createDownloadButton();
      const url = window.URL.createObjectURL(blob);
      downloadButton.href = url;
      downloadButton.download = "profiles.csv"; // Nom du fichier à télécharger
      downloadButton.style.display = "block"; // Afficher le bouton de téléchargement
    })
    .catch((error) => {
      console.error("Erreur lors du téléchargement du CSV:", error);
    })
    .finally(() => {
      // Masquer le loader une fois la requête terminée
      document.getElementById("loader").style.display = "none";
    });
};

function createDownloadButton() {
  const modal = document.getElementById("list-modal");
  const button = document.createElement("a");
  button.id = "download-csv";
  button.className = "compagnon-button";
  button.textContent = "Télécharger le CSV";
  button.style.display = "none"; // Masquer le bouton par défaut
  modal.appendChild(button);
  button.addEventListener("click", () => {
    document.getElementById("content-modal-compagnon").style.display = "block";
    document.getElementById("job-critera-modal").style.display = "flex";
    button.style.display = "none"; // Masquer le bouton après le téléchargement
  });
  return button;
}

const launchProfileRetrieval = () => {
  fetch(`https://your-server-url.com/api/compagnon/launch/${RECRUITER_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: null,
  });

  getProfilesData();
};

function updatePaginationInfo() {
  // TODO: Implémenter la logique pour extraire le numéro de la page actuelle et le nombre total de pages
  // Ceci est un placeholder pour la logique d'extraction
  const currentPageNumber = document.querySelector('[aria-current="true"]')?.innerText || 0; // Exemple statique, doit être dynamique

  let totalPageNumber = 1; // Exemple statique, doit être dynamique

  const paginationBtns = document.querySelectorAll("li[data-test-pagination-page-btn]");

  // Vérifiez si au moins un élément a été trouvé
  if (paginationBtns?.length > 0) {
    // Prenez le dernier élément de la liste
    const lastPaginationBtn = paginationBtns[paginationBtns.length - 1];

    // Lisez la valeur de l'attribut data-test-pagination-page-btn
    totalPageNumber = lastPaginationBtn.getAttribute("data-test-pagination-page-btn");
  }

  const statusMessage = document.getElementById("retrieval-status-message");
  if (statusMessage) {
    statusMessage.innerText = `Page actuelle : ${currentPageNumber} sur ${totalPageNumber}`;
  }
}

async function getProfilesData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("profilesData", async function (data) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }

      console.log("data", data);
      if (data?.profilesData?.["elements"] !== undefined) {
        Promise.all(
          (data?.profilesData?.["elements"] || [])
            .filter((profileData) => profileData !== null)
            .map(async (profileData) => {
              console.log("profileData", profileData);
              console.log("Données du profil récupérées:", data.profileData);

              let userObject = {
                linkedinUrl: "",
                linkedinId: profileData.objectUrn?.split("urn:li:member:")?.[1],
              };
              if (profileData["entityUrn"] !== undefined) {
                const urlParts = profileData["entityUrn"]?.split(",");
                const profilId = urlParts[0].replace("urn:li:fs_salesProfile:(", "");
                console.log("profilId", profilId);
                userObject["linkedinUrl"] = "https://www.linkedin.com/in/" + profilId;
              }

              return userObject;
            })
        ).then((profilesData) => {
          lastSendToHuntMeLeadsTime = Date.now();
          sendToHuntMeLeads({ profilesData });
          goToNextPage();
        });
      }
    });
  });
}

async function goToNextPage() {
  const currentTime = Date.now();
  const timeSinceLastPageChange = currentTime - lastPageChangeTime;

  if (timeSinceLastPageChange < WAITING_TIME_BETWEEN_PAGNIATION) {
    // Si moins de 30 secondes se sont écoulées depuis le dernier changement de page
    const waitTime = WAITING_TIME_BETWEEN_PAGNIATION - timeSinceLastPageChange;
    console.log(`Attente de ${waitTime / 1000} secondes avant de changer de page...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime)); // Attendre le temps restant
  }

  if (stopPagination) {
    console.log("Pagination arrêtée.");
    return; // Ne pas continuer si la pagination est arrêtée
  }

  const nextPageButton = document.querySelector("button.artdeco-pagination__button--next");
  if (nextPageButton && !nextPageButton.disabled) {
    nextPageButton.click();
    lastPageChangeTime = Date.now(); // Mettre à jour le moment du dernier changement de page
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Attendre un peu pour que la page charge
    updatePaginationInfo()
    getProfilesData();
  } else {
    console.log("Fin de la pagination ou bouton suivant désactivé.");
  }
}

async function sendToHuntMeLeads({ profilesData }) {
  lastSendToHuntMeLeadsTime = Date.now();
  const url = `https://your-server-url.com/api/compagnon/add-profils/${RECRUITER_ID}/${HUNTMELEADS_LIST_ID}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidates: profilesData,
        criteria: null,
      }),
    });

    if (!response.ok) throw new Error("Network response was not ok.");

    const data = await response.json();
    console.log("Response data from HuntMeLeads:", data);
  } catch (error) {
    console.error("Error during the HuntMeLeads request:", error);
  }
}

setTimeout(() => {
  updatePaginationInfo();
}, 3000);

createAndManageModal();

