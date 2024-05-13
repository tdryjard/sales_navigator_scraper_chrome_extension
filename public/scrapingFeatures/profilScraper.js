function createGetProfilModal() {
  const modal = document.createElement("div");
  modal.id = "profil-modal";
  modal.style.cssText = `
    position: fixed;
    right: 0;
    top: 0;
    width: 300px;
    height: 100%;
    background-color: white;
    border-left: 1px solid #ccc;
    padding: 20px;
    box-shadow: -2px 0 3px rgba(0,0,0,0.3);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  // Ajouter le contenu initial de la modal, y compris le bouton "Récupérer le profil"
  modal.innerHTML = `
    <div id="modalContent">
      <button id="fetchProfileBtn" class="compagnon-button">Récupérer le profil</button>
    </div>
    <img src="" type="button" id="close-profil-modal" style="position: absolute; top: 20px; right: 20px; height: 25px; width: 25px; cursor: pointer;" />
    <img src="" style="width: 100px; height: 100px; display: none;" id="profil-loader" />
  `;

  document.body.appendChild(modal);
  document.getElementById("close-profil-modal").src = chrome.runtime.getURL("close.png");
  document.getElementById("profil-loader").src = chrome.runtime.getURL("loader.gif");

  // Fermer la fenêtre modale
  document.getElementById("close-profil-modal").onclick = function () {
    document.getElementById("profil-modal").style.display = "none";
    document.getElementsByClassName("modal-background")[0].style.display = "none";
  };

  // Afficher le loader et récupérer les données du profil au clic du bouton
  const fetchProfileBtn = document.getElementById("fetchProfileBtn");
  fetchProfileBtn.addEventListener("click", function () {
    // Masquer le bouton et afficher le loader
    fetchProfileBtn.style.display = "none";
    const loader = document.getElementById("profil-loader");
    loader.style.display = "block";

    // Appel de la fonction pour récupérer les données du profil
    getProfileData().then(() => {
      // Masquer le loader une fois les données récupérées
      loader.style.display = "none";
    }).catch((error) => {
      console.error("Erreur lors de la récupération des données du profil :", error);
      loader.style.display = "none"; // Masquer le loader en cas d'erreur
    });
  });

}

async function getProfileData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("profileData", async function (data) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }

      console.log("data", data);
      const profileData = data.profileData;
      if (profileData) {
        let profileInformation = {
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
          skills: profileData.skills?.map((skill) => skill.name),
          languages: profileData.languages?.map((language) => language.name),
          summary: profileData.summary,
          linkedin_experiences: profileData.positions.map((experience) => ({
            title: experience.title,
            company: experience.companyName,
            location: experience.location,
            description: experience.description,
            ends_at: {
              month: experience.endedOn?.month,
              year: experience.endedOn?.year,
              day: experience.endedOn?.day,
            },
            starts_at: {
              month: experience.startedOn?.month,
              year: experience.startedOn?.year,
              day: experience.startedOn?.day,
            },
          })),
          linkedin_formations: profileData.educations.map((education) => ({
            degree_name: education.degree,
            school: education.schoolName,
            field_of_study: education.fieldsOfStudy?.[0] || "",
            starts_at: {
              month: education.startedOn?.month,
              year: education.startedOn?.year,
              day: education.startedOn?.day,
            },
            ends_at: {
              month: education.endedOn?.month,
              year: education.endedOn?.year,
              day: education.endedOn?.day,
            },
          })),
        };

        const address = profileData.location;
        const isCityRegionCoutnryAddress = address?.split(",").length === 3;
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

        sendProfilToHuntMeLeads({ profileInformation });
      }
    });
  });
}

async function sendProfilToHuntMeLeads({ profileInformation }) {
  const url = `https://your-server-url.com/api/compagnon/add-profil/${RECRUITER_ID}/${HUNTMELEADS_LIST_ID}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate: profileInformation,
      }),
    });

    if (!response.ok) throw new Error("Network response was not ok.");

    const data = await response.json();
    displayProfileData(data.candidate);
    console.log("Response data from HuntMeLeads:", data);
  } catch (error) {
    console.error("Error during the HuntMeLeads request:", error);
  }
}

function displayProfileData(data) {
  document.getElementById("profil-loader").style.display = "none";
  let contentHtml = `<div style="height: 100vh; padding: 30px; display: flex; flex-direction: column;">`;
  contentHtml += `<h3>${data.user_first_name} ${data.user_last_name}</h3>`;

  // Exemple d'affichage des informations
  contentHtml += `<p style="font-size: 16px; margin-bottom: 20px;" >${data.job_title}</p>`;
  contentHtml += `<p style="font-size: 14px; margin-bottom: 10px;"><b>Email personnel:</b> ${
    data.email || "Non trouvée"
  }</p>`;
  contentHtml += `<p style="font-size: 14px; margin-bottom: 10px;"><b>Email professionnel:</b> ${
    data.email_pro || "Non trouvée"
  }</p>`;
  contentHtml += `<p style="font-size: 14px; margin-bottom: 20px;"><b>Téléphone:</b> ${
    data.phone || "Non trouvé"
  }</p>`;
  contentHtml += `<p style="font-size: 14px; margin-bottom: 10px;"><b>Diplomé depuis:</b> ${
    data.graduate_since + " ans"
  }</p>`;
  contentHtml += `<p style="font-size: 14px; margin-bottom: 10px;"><b>Expérience estimée:</b> ${
    data.experience_years + " ans"
  }</p>`;
  if (data.languages.length > 0) {
    contentHtml += `<p style="font-size: 14px; margin-bottom: 30px;"><b>Langues:</b> ${data.languages.join(
      ", "
    )}</p>`;
  }
  contentHtml += `<a href="${data.cv_url}" target="_blank"><button class="compagnon-button"> Voir le CV</button></a>`;
  contentHtml += "</div>";

  // Vous pouvez étendre cette partie pour afficher plus d'informations
  // basées sur la structure de votre réponse API

  document.getElementById("modalContent").innerHTML = contentHtml;
}


createGetProfilModal();