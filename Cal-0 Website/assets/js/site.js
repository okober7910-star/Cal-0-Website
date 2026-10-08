(() => {
  "use strict";

  const config = window.CAL0_CONFIG || {};
  const product = config.product || {};
  const cartKey = "cal0-cart-v1";
  const selectors = {
    overlay: document.querySelector("[data-overlay]"),
    mobileDrawer: document.querySelector("[data-mobile-drawer]"),
    cartDrawer: document.querySelector("[data-cart-drawer]"),
    searchDialog: document.querySelector("[data-search-dialog]"),
    cartCount: document.querySelectorAll("[data-cart-count]"),
    cartContent: document.querySelector("[data-cart-content]"),
    toastRegion: document.querySelector("[data-toast-region]")
  };

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD"
  });

  function getCartQuantity() {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || "{}");
      const quantity = Number.parseInt(saved.quantity, 10);
      return Number.isFinite(quantity) && quantity > 0 ? 1 : 0;
    } catch (_error) {
      return 0;
    }
  }

  function setCartQuantity(quantity) {
    const safeQuantity = Number.parseInt(quantity, 10) > 0 ? 1 : 0;
    if (safeQuantity === 0) {
      localStorage.removeItem(cartKey);
    } else {
      localStorage.setItem(cartKey, JSON.stringify({ quantity: safeQuantity }));
    }
    renderCart();
  }

  function showToast(message) {
    if (!selectors.toastRegion) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    selectors.toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3600);
  }

  function syncBodyLock() {
    const anyOpen =
      selectors.mobileDrawer?.classList.contains("is-open") ||
      selectors.cartDrawer?.classList.contains("is-open") ||
      selectors.searchDialog?.classList.contains("is-open");
    document.body.classList.toggle("no-scroll", Boolean(anyOpen));
    selectors.overlay?.classList.toggle("is-open", Boolean(anyOpen));
  }

  function closeAllPanels() {
    selectors.mobileDrawer?.classList.remove("is-open");
    selectors.cartDrawer?.classList.remove("is-open");
    selectors.searchDialog?.classList.remove("is-open");
    document.querySelectorAll("[aria-expanded='true'][data-panel-trigger]").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", "false");
    });
    syncBodyLock();
  }

  function openPanel(panelName, trigger) {
    closeAllPanels();
    const map = {
      mobile: selectors.mobileDrawer,
      cart: selectors.cartDrawer,
      search: selectors.searchDialog
    };
    const panel = map[panelName];
    if (!panel) return;
    panel.classList.add("is-open");
    trigger?.setAttribute("aria-expanded", "true");
    syncBodyLock();
    const focusTarget = panel.querySelector("button, a, input, textarea, select");
    window.setTimeout(() => focusTarget?.focus(), 80);
  }

  function renderCart() {
    const quantity = getCartQuantity();
    selectors.cartCount.forEach((element) => {
      element.textContent = String(quantity);
      element.hidden = quantity === 0;
    });

    if (!selectors.cartContent) return;

    if (quantity === 0) {
      selectors.cartContent.innerHTML = `
        <div class="cart-empty">
          <div>
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/>
            </svg>
            <h3>Your cart is empty</h3>
            <p>Explore Cal-0 Mango Konjac Jelly and add a case when you are ready.</p>
            <button class="button button-primary" type="button" data-close-panels data-scroll-shop>Continue shopping</button>
          </div>
        </div>`;
      bindDynamicCartActions();
      return;
    }

    const unitPrice = Number(product.price || 0);
    const total = unitPrice * quantity;
    const statusMessage = config.salesEnabled
      ? "Shipping address and final order details are collected on the secure Stripe checkout page."
      : "Online ordering is temporarily unavailable.";

    selectors.cartContent.innerHTML = `
      <div class="drawer-content">
        <article class="cart-item">
          <div class="cart-item-image">
            <img src="${escapeHtml(product.image || "assets/images/case-and-pouch.webp")}" alt="${escapeHtml(product.name || "Cal-0 Mango Konjac Jelly")}" width="180" height="180">
          </div>
          <div>
            <h3>${escapeHtml(product.name || "Cal-0 Mango Konjac 10 Pack")}</h3>
            <div class="cart-item-price">${money.format(unitPrice)}</div>
            <div class="cart-item-controls">
              <span class="cart-case-count">1 case • 10 pouches</span>
              <button class="cart-remove" type="button" data-cart-remove>Remove</button>
            </div>
          </div>
        </article>
        <div class="cart-summary">
          <div class="cart-summary-row"><span>Subtotal</span><strong>${money.format(total)}</strong></div>
          <button class="button button-primary button-block" type="button" data-checkout>${config.salesEnabled ? "Secure Checkout" : "Unavailable"}</button>
          <p class="cart-note">${escapeHtml(statusMessage)}</p>
        </div>
      </div>`;
    bindDynamicCartActions();
  }

  function bindDynamicCartActions() {
    selectors.cartContent?.querySelector("[data-cart-remove]")?.addEventListener("click", () => {
      setCartQuantity(0);
      showToast("Item removed from your cart.");
    });
    selectors.cartContent?.querySelector("[data-checkout]")?.addEventListener("click", startCheckout);
    selectors.cartContent?.querySelectorAll("[data-close-panels]").forEach((button) => {
      button.addEventListener("click", closeAllPanels);
    });
    selectors.cartContent?.querySelector("[data-scroll-shop]")?.addEventListener("click", () => {
      document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function startCheckout() {
    if (!config.salesEnabled) {
      showToast("Online ordering is temporarily unavailable.");
      return;
    }
    if (!config.checkoutUrl) {
      showToast("Secure checkout is temporarily unavailable. Please try again later.");
      return;
    }
    window.location.assign(config.checkoutUrl);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function initializeConfigContent() {
    document.querySelectorAll(".announcement-bar").forEach((element) => {
      element.textContent = config.salesEnabled
        ? config.announcementLive || "10 Calories • 300mg Vitamin C • Mango Konjac Jelly"
        : "Online ordering is temporarily unavailable";
    });
    document.querySelectorAll("[data-brand-name]").forEach((element) => {
      element.textContent = config.brandName || "Cal-0";
    });
    document.querySelectorAll("[data-business-name]").forEach((element) => {
      element.textContent = config.businessName || "Cal-0 LLC";
    });
    document.querySelectorAll("[data-brand-email]").forEach((element) => {
      const email = config.email || "cal0business4@gmail.com";
      element.textContent = email;
      if (element.tagName === "A") element.href = `mailto:${email}`;
    });
    document.querySelectorAll("[data-brand-location]").forEach((element) => {
      element.textContent = config.location || "San Diego, CA";
    });
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
    document.querySelectorAll("[data-product-name]").forEach((element) => {
      element.textContent = product.name || "Cal-0 Mango Konjac 10 Pack";
    });
    document.querySelectorAll("[data-product-price]").forEach((element) => {
      element.textContent = money.format(Number(product.price || 0));
    });
    document.querySelectorAll("[data-product-status]").forEach((element) => {
      element.textContent = config.salesEnabled ? "10-pouch case" : "Temporarily unavailable";
    });
  }

  function initializePanelControls() {
    document.querySelectorAll("[data-open-panel]").forEach((trigger) => {
      trigger.addEventListener("click", () => openPanel(trigger.dataset.openPanel, trigger));
    });
    document.querySelectorAll("[data-close-panels]").forEach((trigger) => {
      trigger.addEventListener("click", closeAllPanels);
    });
    selectors.overlay?.addEventListener("click", closeAllPanels);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllPanels();
    });
  }

  function initializeProductQuantity() {
    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.addEventListener("click", () => {
        setCartQuantity(1);
        showToast("1 case added to your cart.");
        openPanel("cart", document.querySelector("[data-open-panel='cart']"));
      });
    });
  }

  function initializeProductGallery() {
    document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
      const mainImage = gallery.querySelector("[data-main-product-image]");
      gallery.querySelectorAll("[data-gallery-image]").forEach((button) => {
        button.addEventListener("click", () => {
          const nextSrc = button.dataset.galleryImage;
          const nextAlt = button.dataset.galleryAlt || product.name || "Cal-0 product image";
          if (!mainImage || !nextSrc) return;
          mainImage.style.opacity = "0";
          window.setTimeout(() => {
            mainImage.src = nextSrc;
            mainImage.alt = nextAlt;
            mainImage.style.opacity = "1";
          }, 120);
          gallery.querySelectorAll("[data-gallery-image]").forEach((thumb) => {
            thumb.setAttribute("aria-current", String(thumb === button));
          });
        });
      });
    });
  }

  function initializeFaq() {
    document.querySelectorAll("[data-faq-question]").forEach((button) => {
      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
      });
    });
  }

  function initializeForms() {
    document.querySelectorAll("[data-static-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = form.querySelector("[data-form-message]");
        const submitButton = form.querySelector("button[type='submit']");
        const formData = new FormData(form);
        const type = form.dataset.formType || "contact";

        if (message) message.textContent = "";
        if (submitButton) submitButton.disabled = true;

        try {
          if (config.formEndpoint) {
            const response = await fetch(config.formEndpoint, {
              method: "POST",
              body: formData,
              headers: { Accept: "application/json" }
            });
            if (!response.ok) throw new Error("Form submission failed");
            form.reset();
            if (message) message.textContent = type === "newsletter" ? "Thanks for signing up for Cal-0 updates!" : "Thanks. Your message was sent.";
            showToast(type === "newsletter" ? "You signed up for Cal-0 updates." : "Your message was sent.");
          } else {
            const fields = [...formData.entries()]
              .filter(([key]) => !key.startsWith("_"))
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n");
            const subject = type === "newsletter" ? "Cal-0 updates signup" : "Cal-0 website contact";
            const mailto = `mailto:${encodeURIComponent(config.email || "cal0business4@gmail.com")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fields)}`;
            if (message) message.textContent = "Your email app is opening so you can send this message.";
            window.location.href = mailto;
          }
        } catch (_error) {
          if (message) message.textContent = "Something went wrong. Please email us directly.";
          showToast("The form could not be sent. Please email Cal-0 directly.");
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    });
  }

  function initializeSearch() {
    const form = document.querySelector("[data-search-form]");
    const input = form?.querySelector("input[type='search']");
    const results = document.querySelector("[data-search-results]");
    if (!form || !input || !results) return;

    const render = (query) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        results.innerHTML = '<p class="search-no-results">Search Cal-0 products and pages.</p>';
        return;
      }
      const productTerms = `${product.name} mango konjac jelly vitamin c snack nutrition shop`.toLowerCase();
      const matchesProduct = productTerms.includes(normalized) || normalized.split(/\s+/).some((term) => productTerms.includes(term));
      const pageMatches = [
        { title: "About Cal-0", url: "index.html#about", terms: "about story san diego oliver" },
        { title: "Nutrition", url: "index.html#nutrition", terms: "nutrition ingredients vitamin c calories sugar" },
        { title: "Frequently Asked Questions", url: "index.html#faq", terms: "faq questions konjac how eat drink snack" },
        { title: "Contact", url: "contact.html", terms: "contact email phone retailer wholesale" }
      ].filter((item) => item.terms.includes(normalized) || normalized.split(/\s+/).some((term) => item.terms.includes(term)));

      let html = "";
      if (matchesProduct) {
        html += `
          <a class="search-result-card" href="index.html#shop">
            <img src="${escapeHtml(product.image || "assets/images/case-and-pouch.webp")}" alt="${escapeHtml(product.name)}" width="180" height="180">
            <span><strong>${escapeHtml(product.name)}</strong><br><span>${money.format(Number(product.price || 0))}</span></span>
          </a>`;
      }
      pageMatches.forEach((item) => {
        html += `<p><a class="text-link" href="${item.url}">${escapeHtml(item.title)} →</a></p>`;
      });
      results.innerHTML = html || '<p class="search-no-results">No products found.</p>';
    };

    input.addEventListener("input", () => render(input.value));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      render(input.value);
    });
  }

  function initializeCatalog() {
    const grid = document.querySelector("[data-catalog-grid]");
    const empty = document.querySelector("[data-catalog-empty]");
    const count = document.querySelector("[data-catalog-count]");
    if (!grid || !empty || !count) return;

    if (!config.salesEnabled) {
      grid.hidden = true;
      empty.hidden = false;
      count.textContent = "0 items";
      return;
    }

    empty.hidden = true;
    grid.hidden = false;
    count.textContent = "1 item";
    grid.innerHTML = `
      <article class="catalog-product-card">
        <a class="catalog-card-image" href="index.html#shop">
          <img src="${escapeHtml(product.image || "assets/images/case-and-pouch.webp")}" alt="${escapeHtml(product.name)}" width="800" height="800">
        </a>
        <div class="catalog-card-body">
          <h2><a href="index.html#shop">${escapeHtml(product.name)}</a></h2>
          <p class="catalog-card-price">${money.format(Number(product.price || 0))}</p>
          <a class="button button-primary button-block" href="index.html#shop">View product</a>
        </div>
      </article>`;
  }

  function initializeAccountButton() {
    document.querySelectorAll("[data-account-button]").forEach((button) => {
      button.addEventListener("click", () => {
        showToast("Customer accounts are not enabled on this static site.");
      });
    });
  }

  function initializeAnimations() {
    const elements = document.querySelectorAll("[data-animate]");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px" }
    );
    elements.forEach((element) => observer.observe(element));
  }

  function initializeInternalPanelLinks() {
    document.querySelectorAll(".mobile-nav a, [data-drawer-link]").forEach((link) => {
      link.addEventListener("click", closeAllPanels);
    });
  }

  initializeConfigContent();
  initializePanelControls();
  initializeProductQuantity();
  initializeProductGallery();
  initializeFaq();
  initializeForms();
  initializeSearch();
  initializeCatalog();
  initializeAccountButton();
  initializeAnimations();
  initializeInternalPanelLinks();
  renderCart();
})();
