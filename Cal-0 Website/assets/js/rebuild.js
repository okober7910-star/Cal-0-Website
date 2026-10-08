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

/* Restore the original image-rich experience without changing checkout. */
(() => {
  const images = [
    ["case-and-pouch.webp", "Cal-0 10-pack box and mango pouch", "10-Pack"],
    ["product-back-beach.webp", "Back of the Cal-0 mango pouch", "Back of Pouch"],
    ["product-benefits-alt.webp", "Cal-0 mango pouch and product benefits", "Product Benefits"],
    ["nutrition-label.webp", "Cal-0 Nutrition Facts", "Nutrition Facts"]
  ];
  const host = document.querySelector(".hero-photo") || document.querySelector(".rounded-photo:has([data-product-image])");
  if (host) {
    const track = document.createElement("div");
    track.className = "photo-track";
    track.id = "cal0-photo-track";
    track.tabIndex = 0;
    track.setAttribute("role", "region");
    track.setAttribute("aria-label", "Product photos. Swipe or use the thumbnail buttons.");
    const thumbs = document.createElement("div");
    thumbs.className = "photo-thumbs";
    const buttons = [];
    images.forEach((item, index) => {
      const slide = document.createElement("div");
      slide.className = "photo-slide";
      const picture = document.createElement("img");
      picture.src = "assets/images/" + item[0];
      picture.alt = item[1];
      picture.width = 800;
      picture.height = 800;
      if (index > 0) picture.loading = "lazy";
      slide.append(picture);
      track.append(slide);
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "View " + item[2]);
      button.setAttribute("aria-controls", track.id);
      button.setAttribute("aria-pressed", String(index === 0));
      const thumb = document.createElement("img");
      thumb.src = picture.src;
      thumb.alt = "";
      thumb.width = 160;
      thumb.height = 160;
      thumb.loading = "lazy";
      button.append(thumb);
      button.addEventListener("click", () => {
        track.scrollTo({left: track.clientWidth * index, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
      });
      buttons.push(button);
      thumbs.append(button);
    });
    const controls = document.createElement("div");
    controls.className = "photo-controls";
    const status = document.createElement("span");
    status.textContent = "1 / 4";
    status.setAttribute("aria-live", "polite");
    [-1, 1].forEach(direction => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = direction < 0 ? "Previous" : "Next";
      button.setAttribute("aria-label", direction < 0 ? "Previous product photo" : "Next product photo");
      button.addEventListener("click", () => {
        const current = Math.round(track.scrollLeft / track.clientWidth);
        const next = (current + direction + images.length) % images.length;
        track.scrollTo({left: next * track.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
      });
      controls.append(button);
      if (direction < 0) controls.append(status);
    });
    track.addEventListener("scroll", () => {
      const current = Math.min(3, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
      buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === current)));
      status.textContent = (current + 1) + " / 4";
    }, {passive: true});
    host.replaceChildren(track, thumbs, controls);
    const oldNav = document.querySelector(".gallery-nav");
    if (oldNav) oldNav.remove();
  }
  const nutrition = document.querySelector(".nutrition-photo img");
  if (nutrition) {
    nutrition.src = "assets/images/nutrition-composite.webp";
    nutrition.alt = "Cal-0 mango pouch with full Nutrition Facts and ingredients";
    nutrition.width = 1254;
    nutrition.height = 1254;
    const link = nutrition.closest("a");
    if (link) link.href = nutrition.src;
    document.querySelectorAll('#nutrition a[href="assets/images/nutrition-label.webp"]').forEach(link => { link.href = "assets/images/nutrition-composite.webp"; });
  }
})();
/* Keep the retailer inquiry last, just above the footer. */
(() => {
 const main = document.querySelector("#main-content");
 const wholesale = document.querySelector("#wholesale");
 if (main && wholesale) main.append(wholesale);
})();
/* Retail locations supplied by the founder; addresses checked against public listings. */
(() => {
 const section = document.querySelector('#stores > .container');
 if (!section) return;
 const stores = [
  {name:'Windmill Farms', area:'Del Cerro', address:'6386 Del Cerro Blvd, San Diego, CA 92120'},
  {name:"Boney’s Bayside Market", area:'Coronado', address:'155 Orange Ave, Coronado, CA 92118'},
  {name:'Vine Ripe Market', area:'La Mesa', address:'8191 Fletcher Parkway, La Mesa, CA 91942'},
  {name:'KRISP', area:'Ocean Beach', address:'4976 Newport Ave, San Diego, CA 92107'}
 ];
 const maps = store => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(store.name + ', ' + store.address);
 const intro = section.querySelector('.section-heading .lead');
 if (intro) intro.textContent = 'Pick up Cal-0 at these local markets. Check with the store for current stock before visiting.';
 const featured = document.createElement('div');
 featured.className = 'featured-stores';
 featured.setAttribute('aria-label','Featured Cal-0 retailers');
 stores.forEach(store => {
  const link = document.createElement('a');
  link.href = maps(store); link.target = '_blank'; link.rel = 'noopener noreferrer';
  const name = document.createElement('strong'); name.textContent = store.name;
  const area = document.createElement('span'); area.textContent = store.area;
  link.append(name,area); featured.append(link);
 });
 const dropdown = section.querySelector('details');
 section.insertBefore(featured,dropdown);
 const photos = document.createElement('div'); photos.className = 'retail-photos';
 const base = 'https://raw.githubusercontent.com/okober7910-star/Cal-0-Website/71f93f856cef69169cb69f72e9efbf31d39eea6d/Cal-0%20Website/assets/images/';
 [
  ['C60350A5-6951-416A-9C4B-85C29963435E_1_105_c.jpeg','Cal-0 mango jelly pouches on a local market shelf'],
  ['CoronadoCal-0.jpeg','Cal-0 photographed in Coronado']
 ].forEach(photo => {
  const figure = document.createElement('figure'); const image = document.createElement('img');
  image.src = base + photo[0]; image.alt = photo[1]; image.loading = 'lazy';
  figure.append(image); photos.append(figure);
 });
 section.insertBefore(photos,dropdown);
 if (dropdown) dropdown.querySelector('summary').textContent = 'All Store Locations & Directions';
 const list = section.querySelector('[data-store-list]');
 if (list) {
  list.replaceChildren(); list.hidden = false;
  stores.forEach(store => {
   const card = document.createElement('article'); card.className = 'store-card';
   const name = document.createElement('h3'); name.textContent = store.name;
   const address = document.createElement('address'); address.textContent = store.address;
   const link = document.createElement('a'); link.className = 'text-link'; link.textContent = 'Get Directions';
   link.href = maps(store); link.target = '_blank'; link.rel = 'noopener noreferrer';
   card.append(name,address,link); list.append(card);
  });
 }
 const note = section.querySelector('[data-stores-intro]');
 if (note) note.textContent = 'Current listed locations. Product availability can vary by store.';
 const style = document.createElement('style');
 style.textContent = '.featured-stores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.featured-stores a{display:grid;gap:4px;padding:16px;border:2px solid #0F4D3F;border-radius:14px;line-height:1.35}.featured-stores strong{font-size:1.05rem}.featured-stores span{font-size:.85rem}.retail-photos{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}.retail-photos figure{overflow:hidden;border-radius:18px}.retail-photos img{width:100%;height:320px;object-fit:cover;object-position:center}.store-grid{grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:720px){.featured-stores{grid-template-columns:repeat(2,minmax(0,1fr))}.retail-photos img{height:220px}.store-grid{grid-template-columns:1fr}}@media(max-width:420px){.retail-photos{grid-template-columns:1fr}}';
 document.head.append(style);
})();
