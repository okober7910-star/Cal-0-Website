/*
  CAL-0 site settings
  -------------------
  Live storefront configuration for cal-0.com.

  IMPORTANT:
  - Checkout uses a Stripe-hosted Payment Link. No Stripe secret key is stored in this site.
  - Do not describe a conventional food as "FDA approved."
  - Keep product statements aligned with the final commercial package.
*/
window.CAL0_CONFIG = Object.freeze({
  brandName: "Cal-0",
  businessName: "Cal-0 LLC",
  email: "hello@cal-0.com",
  location: "San Diego, CA",
  announcementLive: "10 Calories • 300mg Vitamin C • Mango Konjac Jelly",

  // Live storefront status.
  salesEnabled: true,

  // Stripe-hosted checkout for one 10-pouch case at $24.99.
  checkoutUrl: "https://buy.stripe.com/00wfZg40F77vbUeeJ11ck01",

  // Optional Formspree endpoint. Leave blank to use the built-in email fallback.
  formEndpoint: "",

  product: {
    id: "cal0-mango-konjac-10-pack",
    name: "Cal-0 Mango Konjac 10 Pack",
    shortName: "Mango Konjac Jelly",
    price: 24.99,
    currency: "USD",
    casePack: 10,
    pouchSize: "150 mL",
    image: "assets/images/case-and-pouch.webp"
  },


  social: {
    instagram: "",
    tiktok: ""
  }
});
