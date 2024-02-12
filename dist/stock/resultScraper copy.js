const RECRUITER_ID = "658d514d8dac71a7830670c8";
const HUNTMELEADS_LIST_ID = "65c737f13f3cf581098b45e6";

let stopPagination = false; // Variable de contrôle pour arrêter la pagination


const test = localStorage.getItem("INTERCEPTOR536721");
console.log(JSON.parse(test))


// Vérifier si le script est déjà injecté pour éviter les doublons
if (!document.getElementById("retrieve-profiles-btn")) {
  const retrieveProfilesButton = document.createElement("button");
  retrieveProfilesButton.id = "retrieve-profiles-btn";
  retrieveProfilesButton.innerText = "Récupérer profils";
  retrieveProfilesButton.className = "retrieve-profiles-btn"; // Appliquer la classe CSS

  document.body.appendChild(retrieveProfilesButton);

  retrieveProfilesButton.addEventListener("click", function () {
    fetch(`https://espace-job-api-0d6c825d5679.herokuapp.com/api/compagnon/launch/${RECRUITER_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: null,
    });
    retrieveProfilesButton.style.display = "none";
    const statusMessage = document.createElement("div");
    statusMessage.id = "retrieval-status-message";
    statusMessage.innerText = `Récupération en cours... Page X sur Y`;
    statusMessage.className = "retrieval-status-message"; // Appliquer la classe CSS

    const stopButton = document.createElement("button");
    stopButton.innerText = "Arrêter";
    stopButton.className = "stop-pagination-btn"; // Appliquer la classe CSS

    document.body.appendChild(statusMessage);
    document.body.appendChild(stopButton);

    updatePaginationInfo();

    scrollSearchResultsContainer(() => {
      updatePaginationInfo();
      clickAllProfiles();
    });

    stopButton.addEventListener("click", function () {
      stopPagination = true;
      statusMessage.remove();
      stopButton.remove();
      retrieveProfilesButton.style.display = "block";
    });
  });
}

function updatePaginationInfo() {
  // TODO: Implémenter la logique pour extraire le numéro de la page actuelle et le nombre total de pages
  // Ceci est un placeholder pour la logique d'extraction
  const currentPageNumber = 1; // Exemple statique, doit être dynamique
  const totalPageNumber = 100; // Exemple statique, doit être dynamique

  const statusMessage = document.getElementById("retrieval-status-message");
  if (statusMessage) {
    statusMessage.innerText = `Récupération en cours... Page ${currentPageNumber} sur ${totalPageNumber}`;
  }

const test = localStorage.getItem("INTERCEPTOR536721");
console.log(JSON.stringify(test))
}

// Fonction pour extraire les données d'un profil
const getProfileData = async (index) => {
  try {
    const showAllPositionsButton = document.querySelector(
      'button[aria-expanded="false"]:contains("Afficher tous les postes")'
    );
    if (showAllPositionsButton) {
      showAllPositionsButton.click();
    }
  } catch {}

  try {
    // Cliquer sur "Afficher toutes les formations"
    const showAllEducationsButton = document.querySelector(
      'button[aria-expanded="false"]:contains("Afficher toutes les formations")'
    );
    if (showAllEducationsButton) {
      showAllEducationsButton.click();
    }
  } catch {}

  let name = "";

  const nameElement = document.querySelector('h1[data-anonymize="person-name"] a');

  // Vérifier si l'élément existe pour éviter les erreurs
  if (nameElement) {
    // Accéder au contenu textuel de l'élément
    name = nameElement.textContent || nameElement.innerText;
    name = name.trim();

    console.log(name); // Affichera "Manon Brunet"
  } else {
    console.log("Élément contenant le nom de la personne non trouvé.");
  }

  const profileInformation = {
    user_first_name: name.split(" ")[0], // Besoin d'un sélecteur spécifique
    user_last_name: name.split(" ")[1], // Besoin d'un sélecteur spécifique
    user_city: "",
    user_country: "",
    profil_picture_url: document.querySelector(".presence-entity--size-6 img")?.src,
    job_title: "",
    linkedin: "",
    linkedin_id: "",
    domain: "",
    user_company_id: "",
    user_company_name: "",
    user_source: "linkedin",
    experiences: [], 
    formations: [], 
  };


  // profil url
  const menuTrigger = document.querySelector(
    '[aria-label="Ouvrir le menu de dépassement de capacité des actions"]'
  );
  if (menuTrigger) {
    menuTrigger.click();
    await new Promise((resolve) => setTimeout(resolve, 500)); // Attendre que le menu s'ouvre

    const profileLinkElement = document.querySelectorAll(".ember-view._item_1xnv7i");
    if (profileLinkElement?.[3]) {
      const profileUrl = profileLinkElement[3].href;
      profileInformation.user_url = profileUrl;
    } else {
      console.log("Lien du profil non trouvé.");
    }
  } else {
    console.log("Déclencheur de menu de profil non trouvé.");
  }

  // linkedin_id
  const splitUserUrl = profileInformation.user_url?.split("-");
  profileInformation.linkedin_id = splitUserUrl?.[splitUserUrl.length - 1] || "";

  // CITY & COUNTRY
  const address = document.querySelector(".WqGIGXyUgzSUynTgcWLQzvVQsiqxQFJwDqDGw");
  const isCityRegionCoutnryAddress = address?.innerText.split(",").length === 3;
  if (isCityRegionCoutnryAddress) {
    profileInformation.user_city = address?.innerText.split(",")[0].trim();
    profileInformation.user_country = address?.innerText.split(",")[2].trim();
  } else {
    if (address?.innerText.includes("France")) {
      profileInformation.user_country = "France";
    } else {
      profileInformation.user_city = address?.innerText;
    }
  }

  // CURRENT JOB
  const jobElements = document.querySelectorAll(
    '.artdeco-entity-lockup__subtitle span[data-anonymize="title"]'
  );
  if (jobElements.length > index) {
    // Vérifier si l'élément existe pour cet index
    profileInformation.job_title = jobElements[index]?.innerText.trim() || "";
  }

  const companyLink = document.querySelectorAll('[data-control-name="view_company_via_profile_lockup"]')[
    index
  ];
  const currentCompany = companyLink ? companyLink.textContent.trim() : "";

  // Tentative de récupération du domaine de l'entreprise via Clearbit
  let domain = "";
  try {
    const clearbitResponse = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${currentCompany}`
    );
    const companies = await clearbitResponse.json();
    if (companies.length > 0 && companies[0].domain) {
      domain = companies[0].domain;
      profileInformation.domain = domain;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du domaine via Clearbit :", error);
  }

  console.log("domain", domain);

  // Ajout de current_company à profileInformation
  profileInformation.user_company_name = currentCompany;
  console.log(profileInformation);

  // Si un domaine est trouvé, recherche de l'email via app.huntmeleads
  return profileInformation;
};

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
    const profileData = await getProfileData(index);
    profilesData.push(profileData);
  }

  sendToHuntMeLeads({ profilesData });

  goToNextPage();
}

function goToNextPage() {
  if (stopPagination) {
    console.log("Pagination arrêtée.");
    return; // Ne pas continuer si la pagination est arrêtée
  }
  const nextPageButton = document.querySelector("button.artdeco-pagination__button--next");
  if (nextPageButton && !nextPageButton.disabled) {
    nextPageButton.click();
    setTimeout(() => {
      clickAllProfiles();
    }, 5000);
  } else {
    console.log("Fin de la pagination ou bouton suivant désactivé.");
  }
}

async function sendToHuntMeLeads({ profilesData }) {
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
