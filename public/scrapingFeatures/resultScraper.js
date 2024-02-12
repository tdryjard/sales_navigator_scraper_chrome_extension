const RECRUITER_ID = "658d514d8dac71a7830670c8";
const HUNTMELEADS_LIST_ID = "65c737f13f3cf581098b45e6";
let email_priority = "B2C"; // Par défaut, prioriser les emails personnels
let stopPagination = false; // Variable de contrôle pour arrêter la pagination
let currentPage = 1;
let lastSendToHuntMeLeadsTime = 0;

function createAndManageModal() {
  const modalBackground = document.createElement("div");
  modalBackground.className = "modal-background";
  document.body.appendChild(modalBackground);

  const modal = document.createElement("div");
  modal.id = "modal";
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
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 10px;">
        <button style="margin: 10px" type="button" class="compagnon-button" id="start-retrieval">Lancer la récupération de profils</button>
        <button style="margin: 10px; display: none;" type="button" class="compagnon-button-second" id="stop-retrieval">Arrêter la récupération de profils</button>
        <button style="margin: 5px" type="button" class="compagnon-button-second" id="close-modal">Fermer</button>
      </div>
    </form>
  </div>
  `;

  document.getElementById("loader").src = chrome.runtime.getURL("loader.gif");

  // Gestion de l'affichage de la modal
  document.getElementById("retrieve-profiles-btn").addEventListener("click", () => {
    modal.style.display = "block";
    modalBackground.style.display = "block";
    updatePaginationInfo()
  });

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

  startRetrievalButton.addEventListener("click", () => {
    stopPagination = false; // Bascule l'état de stopPagination
    document.getElementById("close-modal").style.display = "none"; // Cache le bouton Fermer
    launchProfileRetrieval();
    startRetrievalButton.style.display = "none";
    stopRetrievalButton.style.display = "block";
    radios[0].style.display = "none";
    radios[1].style.display = "none";
  });

  stopRetrievalButton.addEventListener("click", () => {
    stopPagination = true; // Bascule l'état de stopPagination
    document.getElementById("close-modal").style.display = "block"; // Cache le bouton Fermer
    startRetrievalButton.style.display = "block";
    stopRetrievalButton.style.display = "none";
    radios[0].style.display = "block";
    radios[1].style.display = "block";
    stopProfileRetrieval();
  });

  // Bouton de fermeture de la modal
  const closeModalButton = document.getElementById("close-modal");
  closeModalButton.addEventListener("click", () => {
    modal.style.display = "none";
    modalBackground.style.display = "none";
    stopPagination = true;
  });
}

// Vérifier si le script est déjà injecté pour éviter les doublons
if (!document.getElementById("retrieve-profiles-btn")) {
  const retrieveProfilesButton = document.createElement("button");
  retrieveProfilesButton.id = "retrieve-profiles-btn";
  retrieveProfilesButton.innerText = "Récupérer profils";
  retrieveProfilesButton.className = "compagnon-button";
  document.body.appendChild(retrieveProfilesButton);

  createAndManageModal(); // Appel de la fonction pour créer et gérer la modal
}

const stopProfileRetrieval = () => {
  const currentTime = Date.now();
  const timeElapsedSinceLastSend = currentTime - lastSendToHuntMeLeadsTime;
  const waitTime = 20000 - timeElapsedSinceLastSend; // 20 secondes - temps écoulé

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

  setTimeout(() => {
    // Le délai est écoulé, procéder au téléchargement du CSV
    downloadCSV();
  }, delay);
};

const downloadCSV = () => {
  fetch(
    `https://espace-job-api-0d6c825d5679.herokuapp.com/api/compagnon/download-csv/${RECRUITER_ID}?email_priority=${email_priority}`
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
  const modal = document.getElementById("modal");
  const button = document.createElement("a");
  button.id = "download-csv";
  button.className = "compagnon-button";
  button.textContent = "Télécharger le CSV";
  button.style.display = "none"; // Masquer le bouton par défaut
  modal.appendChild(button);
  button.addEventListener("click", () => {
    document.getElementById("content-modal-compagnon").style.display = "block";
    button.style.display = "none"; // Masquer le bouton après le téléchargement
  });
  return button;
}

const launchProfileRetrieval = () => {
  fetch(`https://espace-job-api-0d6c825d5679.herokuapp.com/api/compagnon/launch/${RECRUITER_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: null,
  });

  scrollSearchResultsContainer(() => {
    clickAllProfiles();
  });
};

function updatePaginationInfo() {
  // TODO: Implémenter la logique pour extraire le numéro de la page actuelle et le nombre total de pages
  // Ceci est un placeholder pour la logique d'extraction
  const currentPageNumber = document.querySelector('[aria-current="true"]').innerText; // Exemple statique, doit être dynamique

  let totalPageNumber = 1; // Exemple statique, doit être dynamique

  const paginationBtns = document.querySelectorAll("li[data-test-pagination-page-btn]");

  // Vérifiez si au moins un élément a été trouvé
  if (paginationBtns.length > 0) {
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

function scrollSearchResultsContainer(callback) {
  const searchResultsContainer = document.getElementById("search-results-container");

  if (!searchResultsContainer) {
    console.log("Conteneur des résultats de recherche non trouvé.");
    callback();
    return;
  }

  let lastScrollTop = searchResultsContainer.scrollTop;
  const scrollIncrement = 400; // Définir le nombre de pixels à défiler à chaque itération

  const scrollStep = () => {
    // Si on n'est pas encore en bas du conteneur, on continue de défiler
    if (
      searchResultsContainer.scrollTop + searchResultsContainer.clientHeight <
      searchResultsContainer.scrollHeight - 300
    ) {
      searchResultsContainer.scrollTop += scrollIncrement;

      // Si le scroll n'a pas bougé (bloqué par le bas de la page ou le chargement est complet), on arrête
      if (lastScrollTop === searchResultsContainer.scrollTop) {
        callback();
      } else {
        lastScrollTop = searchResultsContainer.scrollTop;
        setTimeout(scrollStep, 200); // Attendez un peu avant le prochain scroll
      }
    } else {
      // Arrivé en bas, ou presque, on exécute le callback
      callback();
    }
  };

  scrollStep();
}

async function clickAllProfiles() {
  updatePaginationInfo();
  const profileLinks = document.querySelectorAll('a[data-view-name="search-results-lead-name"]');
  const profilesData = []; // Pour stocker les données de tous les profils

  for (let index = 0; index < profileLinks.length; index++) {
    const profileLink = profileLinks[index];
    if (stopPagination) {
      console.log("Arrêt de la récupération des profils.");
      return;
    }

    profileLink.click();
    // Attend 2 secondes après avoir cliqué sur le profil
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Passer l'index actuel à getProfileData
    const profileData = await getProfileData();
    console.log("profileData", profileData);
    profilesData.push(profileData);
  }

  sendToHuntMeLeads({ profilesData });

  goToNextPage();
}

const parseMonth = (monthIndex) => {
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return months[monthIndex - 1];
};

async function getProfileData() {
  // Supposons que vous avez déjà une fonction ou une logique pour traiter les données de la requête
  // par exemple, récupérer les données stockées et les afficher

  return new Promise((resolve, reject) => {
    chrome.storage.local.get("profileData", async function (data) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      console.log("data", data);
      console.log("Données du profil récupérées:", data.profileData);
      const profileData = data.profileData;

      let profileInformation = {
        email: profileData.contactInfo?.primaryEmail || "",
        user_first_name: profileData.firstName || "",
        user_last_name: profileData.lastName || "",
        job_title: profileData.positions?.[0]?.title || "",
        profil_picture_url:
          profileData.profilePictureDisplayImage?.artifacts?.[2]?.fileIdentifyingUrlPathSegment || "",
        user_company_name: profileData.defaultPosition?.companyName || "",
        user_company_id: profileData.defaultPosition?.companyUrn?.split("urn:li:fs_salesCompany:")?.[1],
        linkedin: profileData.flagshipProfileUrl || "",
        linkedin_id: profileData.objectUrn?.split("urn:li:member:")?.[1],
        domain: "",
        user_city: "",
        user_country: "",
        user_region: "",
        user_source: "linkedin",
        experiences: profileData.positions?.map((experience) => ({
          duration: `${parseMonth(experience.startedOn?.month)} ${experience.startedOn?.year} - ${
            !experience.endedOn
              ? "Aujourd'hui"
              : `${parseMonth(experience.endedOn?.month)} ${experience.endedOn?.year}`
          }`,
          title: experience.title,
          company: experience.companyName,
        })),
        formations: profileData.educations?.map((formation) => ({
          title: formation.degree,
          school: formation.school,
          duration: `${formation.startedOn?.year} - ${
            !formation.endedOn ? "Aujourd'hui" : `${formation.endedOn?.year}`
          }`,
        })),
        skills: profileData.skills?.map((skill) => skill.name),
        languages: profileData.languages?.map((language) => language.name),
        summary: profileData.summary,
      };

      const address = profileData.location;
      const isCityRegionCoutnryAddress = address.split(",").length === 3;
      if (isCityRegionCoutnryAddress) {
        profileInformation.user_city = address.split(",")[0].trim();
        profileInformation.user_region = address.split(",")[1].trim();
        profileInformation.user_country = address.split(",")[2].trim();
      } else {
        if (address?.includes("France")) {
          profileInformation.user_country = "France";
        } else {
          profileInformation.user_city = address;
        }
      }

      if (profileInformation.user_company_name) {
        let domain = "";
        try {
          const clearbitResponse = await fetch(
            `https://autocomplete.clearbit.com/v1/companies/suggest?query=${profileInformation.user_company_name}`
          );
          const companies = await clearbitResponse.json();
          if (companies.length > 0 && companies[0].domain) {
            domain = companies[0].domain;
            profileInformation.domain = domain;
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du domaine via Clearbit :", error);
        }
      }

      console.log("profileInformation", profileInformation);

      resolve(profileInformation);
    });
  });
}

function goToNextPage() {
  if (stopPagination) {
    console.log("Pagination arrêtée.");
    return; // Ne pas continuer si la pagination est arrêtée
  }
  const nextPageButton = document.querySelector("button.artdeco-pagination__button--next");
  if (nextPageButton && !nextPageButton.disabled) {
    nextPageButton.click();

  scrollSearchResultsContainer(() => {
    clickAllProfiles();
  });
  } else {
    console.log("Fin de la pagination ou bouton suivant désactivé.");
  }
}

async function sendToHuntMeLeads({ profilesData }) {
  lastSendToHuntMeLeadsTime = Date.now();
  const url = `https://espace-job-api-0d6c825d5679.herokuapp.com/api/compagnon/add-profils/${RECRUITER_ID}/${HUNTMELEADS_LIST_ID}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profilesData),
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
