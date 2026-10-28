(() => {
  "use strict";

  // URL Google Apps Script web aplikacije (završava na /exec).
  const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxN14uUJXGYBEL-Stn46eJM0dtwuUmb7rVKMApW5DkMDw0MmXMBotYoShJUSh6u4fcd/exec";
  const header = document.querySelector("#site-header");
  const menu = document.querySelector("#main-menu");
  const menuToggle = document.querySelector("#menu-toggle");
  const lightbox = document.querySelector("#lightbox");
  const openLightbox = document.querySelector("#open-lightbox");
  const closeLightbox = document.querySelector("#close-lightbox");
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  const submitButton = form.querySelector('button[type="submit"]');

  document.querySelector("#year").textContent = String(new Date().getFullYear());

  const updateHeader = () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const setMenuOpen = (isOpen) => {
    menu.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Zatvori navigaciju" : "Otvori navigaciju");
    menuToggle.textContent = isOpen ? "×" : "☰";
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  openLightbox.addEventListener("click", () => {
    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
      closeLightbox.focus();
    }
  });

  closeLightbox.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  const getFieldError = (input) => {
    const errorId = input.getAttribute("aria-describedby");
    return errorId ? document.getElementById(errorId) : null;
  };

  const fieldIsValid = (input) => {
    if (input.name === "ime" && input.value.trim().length < 2) return false;
    return input.checkValidity();
  };

  const updateFieldState = (input, showError) => {
    const valid = fieldIsValid(input);
    const error = getFieldError(input);
    input.setAttribute("aria-invalid", String(showError && !valid));
    if (error) error.hidden = !showError || valid;
    return valid;
  };

  form.querySelectorAll("[required]").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") updateFieldState(input, true);
    });
    input.addEventListener("blur", () => {
      if (input.value.length > 0) updateFieldState(input, true);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.hidden = true;

    const requiredFields = [...form.querySelectorAll("[required]")];
    const invalidField = requiredFields.find((input) => !updateFieldState(input, true));
    if (invalidField) {
      invalidField.focus();
      return;
    }

    if (!FORM_ENDPOINT) {
      status.textContent = "Slanje formulara još nije podešeno. Upit nije poslat; prije objave povežite formular sa servisom za prijem poruka.";
      status.hidden = false;
      status.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Slanje upita…";
    form.setAttribute("aria-busy", "true");

    try {
      // Google Apps Script ne vraća CORS zaglavlja, zato "no-cors": odgovor se ne može
      // pročitati, ali upit stiže. Greška mreže i dalje završava u catch bloku.
      await fetch(FORM_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(new FormData(form)),
        credentials: "omit"
      });
      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));
      status.textContent = "Hvala vam! Vaš upit je primljen.";
    } catch {
      status.textContent = "Upit nije poslat. Pokušajte ponovo ili nas kontaktirajte drugim putem.";
    } finally {
      status.hidden = false;
      status.focus();
      submitButton.disabled = false;
      submitButton.textContent = "Pošaljite upit";
      form.removeAttribute("aria-busy");
    }
  });
})();
