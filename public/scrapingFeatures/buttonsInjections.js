const retrieveProfilesButton = document.createElement("button");
retrieveProfilesButton.id = "retrieve-profiles-btn";
retrieveProfilesButton.innerText = "Lancer mon compagnon";
retrieveProfilesButton.className = "compagnon-button";

document.body.appendChild(retrieveProfilesButton);

retrieveProfilesButton.addEventListener("click", function () {
  console.log("location.href", location.href)
  if (location.href.includes("/search")) {
    document.getElementById("list-modal").style.display = "flex"; // Afficher la fenêtre modale
    document.getElementById("content-modal-compagnon").style.display = "block";
    document.getElementsByClassName("modal-background")[0].style.display = "block";
    document.getElementById("job-critera-modal").style.display = "flex";
    updatePaginationInfo()
  }
});
