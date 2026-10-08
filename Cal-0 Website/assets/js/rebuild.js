/* Cal-0 progressive enhancements. Shopping and email links work without JS. */
(() => {
  "use strict";
  const config = window.CAL0_CONFIG || {};
  const email = config.email || "hello@cal-0.com";
  document.querySelectorAll("[data-current-year]").forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });
  if (config.salesEnabled === false) {
    document.querySelectorAll("[data-checkout-link]").forEach(link => {
      link.href = "mailto:" + email + "?subject=Cal-0%20order%20availability";
      link.textContent = "Ask about availability";
    });
  } else if (config.checkoutUrl) {
    try {
      const checkout = new URL(config.checkoutUrl);
      if (checkout.protocol === "https:" && checkout.hostname === "buy.stripe.com") {
        document.querySelectorAll("[data-checkout-link]").forEach(link => {
          link.href = checkout.href;
        });
      }
    } catch (_) { /* Preserve the working static checkout link. */ }
  }
  document.querySelectorAll("[data-gallery-link]").forEach(link => {
    link.addEventListener("click", event => {
      const image = document.querySelector("[data-product-image]");
      if (!image) return;
      event.preventDefault();
      image.src = link.getAttribute("href");
      image.alt = link.dataset.galleryAlt || "Cal-0 Mango Konjac Jelly";
      document.querySelectorAll("[data-gallery-link]").forEach(item => {
        item.removeAttribute("aria-current");
      });
      link.setAttribute("aria-current", "true");
    });
  });
  const list = document.querySelector("[data-store-list]");
  const stores = Array.isArray(config.stores) ? config.stores : [];
  const confirmedStores = stores.filter(store => {
    return store && store.confirmed === true && store.name && store.address;
  });
  if (list && confirmedStores.length) {
    const fragment = document.createDocumentFragment();
    confirmedStores.forEach(store => {
      const card = document.createElement("article");
      card.className = "store-card";
      const name = document.createElement("h3");
      name.textContent = store.name;
      const address = document.createElement("address");
      address.textContent = store.address;
      const directions = document.createElement("a");
      directions.className = "text-link";
      directions.href = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(store.name + ", " + store.address);
      directions.textContent = "Get directions →";
      directions.target = "_blank";
      directions.rel = "noopener noreferrer";
      card.append(name, address, directions);
      fragment.append(card);
    });
    list.replaceChildren(fragment);
    list.hidden = false;
    const intro = document.querySelector("[data-stores-intro]");
    if (intro) intro.textContent = "Find Cal-0 at these confirmed locations. Contact the store before visiting to check current stock.";
  }
  const form = document.querySelector("[data-email-draft-form]");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const topic = String(values.get("topic") || "General question");
      const body = [
        "Name: " + String(values.get("name") || ""),
        "Reply email: " + String(values.get("email") || ""),
        "Store / business: " + String(values.get("business") || ""),
        "", String(values.get("message") || "")
      ].join("\n");
      const draft = document.querySelector("[data-draft-link]");
      draft.href = "mailto:" + email + "?subject=" +
        encodeURIComponent("Cal-0: " + topic) + "&body=" + encodeURIComponent(body);
      draft.hidden = false;
      const notice = document.querySelector("[data-form-notice]");
      notice.textContent = "Your email draft is ready, but has not been sent. Click Open Email Draft and send it from your email app. You can also email us directly at " + email + ".";
      draft.focus();
    });
  }
})();
