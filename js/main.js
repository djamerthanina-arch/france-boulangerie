const boutonMenu = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");

if (boutonMenu && menu) {
  boutonMenu.addEventListener("click", function () {
    menu.classList.toggle("ouvert");

    const estOuvert = menu.classList.contains("ouvert");

    boutonMenu.setAttribute("aria-expanded", estOuvert);
    boutonMenu.setAttribute(
      "aria-label",
      estOuvert ? "Fermer le menu" : "Ouvrir le menu",
    );
  });
}

// Carrousel des boulangeries recommandées

const liste = document.querySelector(".liste-boulangeries");
const flecheGauche = document.querySelector(".fleche-gauche");
const flecheDroite = document.querySelector(".fleche-droite");

if (liste && flecheGauche && flecheDroite) {
  function faireDefiler(direction) {
    const carte = liste.querySelector(".carte-boulangerie");

    if (!carte) return;

    const largeurCarte = carte.getBoundingClientRect().width;
    const espace = parseFloat(getComputedStyle(liste).gap) || 0;

    liste.scrollBy({
      left: direction * (largeurCarte + espace),
      behavior: "smooth",
    });
  }

  flecheGauche.addEventListener("click", function () {
    faireDefiler(-1);
  });

  flecheDroite.addEventListener("click", function () {
    faireDefiler(1);
  });
}
