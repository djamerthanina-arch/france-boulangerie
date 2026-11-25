/* =====================================
   DONNÉES DES BOULANGERIES
===================================== */

// Données de démonstration à vérifier.

const boulangeries = [
  {
    nom: "La Maison des Saveurs",
    ville: "Boulogne-Billancourt",
    codePostal: "92100",
    type: "boulangerie",
    image: "assets/images/boulangeries/maison-saveurs.jpg",
    avis: 31,
    latitude: 48.8352,
    longitude: 2.2413,
  },
  {
    nom: "La Fromentine",
    ville: "Boulogne-Billancourt",
    codePostal: "92100",
    type: "patisserie",
    image: "assets/images/boulangeries/fromentine.jpg",
    avis: 30,
    latitude: 48.8352,
    longitude: 2.2413,
  },
  {
    nom: "Aux Fins Délices",
    ville: "Châtenay-Malabry",
    codePostal: "92290",
    type: "snacking",
    image: "assets/images/boulangeries/fins-delices.jpg",
    avis: 26,
    latitude: 48.7651,
    longitude: 2.2776,
  },
];

/* =====================================
   SÉLECTION DES ÉLÉMENTS HTML
===================================== */

const champRecherche = document.querySelector("#recherche");
const boutonRecherche = document.querySelector("#bouton-recherche");
const boutonsFiltres = document.querySelectorAll(".filtre");

const listeResultats = document.querySelector("#liste-resultats");
const nombreResultats = document.querySelector("#nombre-resultats");

const elementCarte = document.querySelector("#carte");
const tuilesCarte = document.querySelector("#tuiles-carte");
const marqueursCarte = document.querySelector("#marqueurs-carte");

const boutonZoomPlus = document.querySelector("#zoom-plus");
const boutonZoomMoins = document.querySelector("#zoom-moins");

let filtreActuel = "tous";
let boulangeriesVisibles = boulangeries;

/* =====================================
   AFFICHAGE DES BOULANGERIES
===================================== */

function afficherBoulangeries(donnees) {
  listeResultats.innerHTML = "";

  nombreResultats.textContent = donnees.length + " boulangerie(s) trouvée(s)";

  if (donnees.length === 0) {
    const message = document.createElement("p");

    message.textContent = "Aucune boulangerie ne correspond à votre recherche.";

    listeResultats.appendChild(message);
    return;
  }

  donnees.forEach(function (boulangerie) {
    const carte = document.createElement("article");
    carte.className = "resultat-boulangerie";

    // Photographie
    const image = document.createElement("img");
    image.src = boulangerie.image;
    image.alt = "Photographie de " + boulangerie.nom;
    image.className = "resultat-image";
    image.loading = "lazy";

    // Contenu
    const contenu = document.createElement("div");
    contenu.className = "resultat-contenu";

    // Nom
    const titre = document.createElement("h4");
    titre.textContent = boulangerie.nom;

    // Ville
    const ville = document.createElement("p");
    ville.className = "resultat-ville";

    ville.textContent =
      "📍 " + boulangerie.ville + " (" + boulangerie.codePostal + ")";

    // Avis
    const avis = document.createElement("div");
    avis.className = "resultat-avis";

    const etoiles = document.createElement("span");
    etoiles.className = "etoiles";
    etoiles.textContent = "★★★★★";

    const nombreAvis = document.createElement("span");
    nombreAvis.textContent = boulangerie.avis + " avis";

    avis.appendChild(etoiles);
    avis.appendChild(nombreAvis);

    // Bouton de localisation
    const boutonCarte = document.createElement("button");
    boutonCarte.type = "button";
    boutonCarte.textContent = "Voir sur la carte →";

    boutonCarte.addEventListener("click", function () {
      centrerCarte(boulangerie.latitude, boulangerie.longitude);
    });

    contenu.appendChild(titre);
    contenu.appendChild(ville);
    contenu.appendChild(avis);
    contenu.appendChild(boutonCarte);

    carte.appendChild(image);
    carte.appendChild(contenu);

    listeResultats.appendChild(carte);
  });
}

/* =====================================
   NORMALISATION DU TEXTE
===================================== */

function normaliserTexte(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =====================================
   RECHERCHE ET FILTRES
===================================== */

function filtrerBoulangeries() {
  const recherche = normaliserTexte(champRecherche.value.trim());

  const resultats = boulangeries.filter(function (boulangerie) {
    const texte = normaliserTexte(
      boulangerie.nom + " " + boulangerie.ville + " " + boulangerie.codePostal,
    );

    const correspondRecherche = texte.includes(recherche);

    const correspondFiltre =
      filtreActuel === "tous" || boulangerie.type === filtreActuel;

    return correspondRecherche && correspondFiltre;
  });

  // Conserver les résultats filtrés pour la carte
  boulangeriesVisibles = resultats;

  afficherBoulangeries(resultats);
  afficherMarqueurs();
}

/* =====================================
   ÉVÉNEMENTS DE RECHERCHE
===================================== */

champRecherche.addEventListener("input", filtrerBoulangeries);

boutonRecherche.addEventListener("click", filtrerBoulangeries);

boutonsFiltres.forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    filtreActuel = bouton.dataset.filtre;

    boutonsFiltres.forEach(function (element) {
      element.classList.remove("actif");
    });

    bouton.classList.add("actif");

    filtrerBoulangeries();
  });
});

/* =====================================
   PARAMÈTRES DE LA CARTE
===================================== */

const tailleTuile = 256;

const zoomMinimum = 5;
const zoomMaximum = 18;

// Centre initial : région parisienne
let centreLatitude = 48.8566;
let centreLongitude = 2.3522;

let zoomCarte = 10;

// Informations du déplacement en cours
let deplacement = null;

/* =====================================
   CONVERSION GÉOGRAPHIQUE
===================================== */

// Latitude / longitude vers pixels
// Projection Web Mercator

function coordonneesPixels(latitude, longitude, zoom) {
  const latitudeLimitee = Math.max(
    -85.05112878,
    Math.min(85.05112878, latitude),
  );

  const tailleMonde = tailleTuile * Math.pow(2, zoom);

  const x = ((longitude + 180) / 360) * tailleMonde;

  const radians = (latitudeLimitee * Math.PI) / 180;

  const y =
    ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) *
    tailleMonde;

  return {
    x: x,
    y: y,
  };
}

// Pixels vers latitude / longitude

function pixelsCoordonnees(x, y, zoom) {
  const tailleMonde = tailleTuile * Math.pow(2, zoom);

  const longitude = (x / tailleMonde) * 360 - 180;

  const latitude =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / tailleMonde))) * 180) /
    Math.PI;

  return {
    latitude: latitude,
    longitude: longitude,
  };
}

/* =====================================
   AFFICHAGE DE LA CARTE
===================================== */

function afficherCarte() {
  const largeur = elementCarte.clientWidth;
  const hauteur = elementCarte.clientHeight;

  if (largeur === 0 || hauteur === 0) {
    return;
  }

  const centre = coordonneesPixels(centreLatitude, centreLongitude, zoomCarte);

  const origineX = centre.x - largeur / 2;
  const origineY = centre.y - hauteur / 2;

  // Supprimer les anciennes tuiles
  tuilesCarte.replaceChildren();

  const debutX = Math.floor(origineX / tailleTuile);

  const finX = Math.floor((origineX + largeur) / tailleTuile);

  const debutY = Math.floor(origineY / tailleTuile);

  const finY = Math.floor((origineY + hauteur) / tailleTuile);

  const nombreTuiles = Math.pow(2, zoomCarte);

  for (let x = debutX; x <= finX; x++) {
    for (let y = debutY; y <= finY; y++) {
      // Éviter les tuiles hors de la carte
      if (y < 0 || y >= nombreTuiles) {
        continue;
      }

      // Gérer la répétition horizontale
      const xNormalise = ((x % nombreTuiles) + nombreTuiles) % nombreTuiles;

      const image = document.createElement("img");

      image.className = "tuile-carte";
      image.alt = "";
      image.draggable = false;

      image.src =
        "https://tile.openstreetmap.org/" +
        zoomCarte +
        "/" +
        xNormalise +
        "/" +
        y +
        ".png";

      image.style.left = x * tailleTuile - origineX + "px";

      image.style.top = y * tailleTuile - origineY + "px";

      tuilesCarte.appendChild(image);
    }
  }

  // Repositionner les marqueurs
  afficherMarqueurs();
}

/* =====================================
   AFFICHAGE DES MARQUEURS
===================================== */

function afficherMarqueurs() {
  marqueursCarte.replaceChildren();

  const centre = coordonneesPixels(centreLatitude, centreLongitude, zoomCarte);

  const largeur = elementCarte.clientWidth;
  const hauteur = elementCarte.clientHeight;

  boulangeriesVisibles.forEach(function (boulangerie) {
    const position = coordonneesPixels(
      boulangerie.latitude,
      boulangerie.longitude,
      zoomCarte,
    );

    const x = position.x - centre.x + largeur / 2;

    const y = position.y - centre.y + hauteur / 2;

    // Ne pas afficher les marqueurs hors de l'écran
    if (x < 0 || x > largeur || y < 0 || y > hauteur) {
      return;
    }

    const marqueur = document.createElement("button");

    marqueur.type = "button";
    marqueur.className = "marqueur-boulangerie";

    marqueur.style.left = x + "px";
    marqueur.style.top = y + "px";

    marqueur.title = boulangerie.nom;

    marqueur.setAttribute("aria-label", "Localiser " + boulangerie.nom);

    marqueur.addEventListener("click", function () {
      centrerCarte(boulangerie.latitude, boulangerie.longitude);
    });

    marqueursCarte.appendChild(marqueur);
  });
}

/* =====================================
   CENTRER SUR UNE BOULANGERIE
===================================== */

function centrerCarte(latitude, longitude) {
  centreLatitude = latitude;
  centreLongitude = longitude;

  zoomCarte = 14;

  afficherCarte();

  // Sur téléphone, défiler jusqu'à la carte
  if (window.innerWidth <= 850) {
    const panneauCarte = document.querySelector(".panneau-carte");

    if (panneauCarte) {
      panneauCarte.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
}

/* =====================================
   BOUTONS DE ZOOM
===================================== */

boutonZoomPlus.addEventListener("click", function () {
  if (zoomCarte < zoomMaximum) {
    zoomCarte++;
    afficherCarte();
  }
});

boutonZoomMoins.addEventListener("click", function () {
  if (zoomCarte > zoomMinimum) {
    zoomCarte--;
    afficherCarte();
  }
});

/* =====================================
   DÉPLACEMENT DE LA CARTE
===================================== */

elementCarte.addEventListener("pointerdown", function (event) {
  // Ne pas déplacer en cliquant sur un bouton
  if (event.target.closest("button")) {
    return;
  }

  deplacement = {
    x: event.clientX,
    y: event.clientY,

    centre: coordonneesPixels(centreLatitude, centreLongitude, zoomCarte),
  };

  elementCarte.setPointerCapture(event.pointerId);
});

elementCarte.addEventListener("pointermove", function (event) {
  if (!deplacement) {
    return;
  }

  const deltaX = event.clientX - deplacement.x;

  const deltaY = event.clientY - deplacement.y;

  const nouveauX = deplacement.centre.x - deltaX;

  const nouveauY = deplacement.centre.y - deltaY;

  const tailleMonde = tailleTuile * Math.pow(2, zoomCarte);

  const position = pixelsCoordonnees(
    nouveauX,
    Math.max(0, Math.min(tailleMonde, nouveauY)),
    zoomCarte,
  );

  centreLatitude = position.latitude;
  centreLongitude = position.longitude;

  afficherCarte();
});

function terminerDeplacement() {
  deplacement = null;
}

elementCarte.addEventListener("pointerup", terminerDeplacement);

elementCarte.addEventListener("pointercancel", terminerDeplacement);

/* =====================================
   ADAPTATION AUX ÉCRANS
===================================== */

window.addEventListener("resize", afficherCarte);

/* =====================================
   AFFICHAGE INITIAL
===================================== */

afficherBoulangeries(boulangeries);
afficherCarte();
