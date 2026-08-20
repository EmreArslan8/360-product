/* =====================================================================
   ORTAK VERİ KATMANI (store.js)
   Mağaza, panel ve sanal kabin bu modülü paylaşır.
   Katalog / stok / fiyat / kampanya / ayarlar localStorage'da tutulur;
   panelden yapılan değişiklik mağazaya ve kabine anında yansır.
   ===================================================================== */

const LS_KEY = "nf_store_v1";

/* --------- Gömülü SVG ürün çizimleri (gerçek foto ile değiştirilebilir) --------- */
export function garmentSVG(fill, shade, kind) {
  const shapes = {
    tshirt: `<path d="M60 40 L100 20 L140 20 L180 40 L210 70 L185 95 L165 80 L165 210 L75 210 L75 80 L55 95 L30 70 Z"/>`,
    shirt: `<path d="M60 40 L100 22 L140 22 L180 40 L208 72 L184 96 L166 82 L166 214 L74 214 L74 82 L56 96 L32 72 Z"/><line x1="120" y1="30" x2="120" y2="210" stroke="${shade}" stroke-width="3"/>`,
    hoodie: `<path d="M85 28 Q120 10 155 28 L188 46 L212 78 L186 102 L168 86 L168 214 L72 214 L72 86 L54 102 L28 78 L52 46 Z"/><path d="M95 30 Q120 60 145 30" fill="none" stroke="${shade}" stroke-width="6"/>`,
    jacket: `<path d="M62 40 L100 22 L140 22 L178 40 L206 72 L182 96 L168 84 L168 214 L120 214 L120 60 L120 214 L72 214 L72 84 L58 96 L34 72 Z"/><line x1="120" y1="40" x2="120" y2="214" stroke="${shade}" stroke-width="4"/>`,
    pants: `<path d="M84 20 L156 20 L162 120 L150 220 L128 220 L120 120 L112 220 L90 220 L78 120 Z"/><line x1="120" y1="24" x2="120" y2="118" stroke="${shade}" stroke-width="3"/>`,
    shorts: `<path d="M82 30 L158 30 L162 96 L146 150 L126 150 L120 96 L114 150 L94 150 L78 96 Z"/>`,
    skirt: `<path d="M86 34 L154 34 L182 168 L58 168 Z"/><line x1="86" y1="42" x2="154" y2="42" stroke="${shade}" stroke-width="4"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <g fill="${fill}" stroke="${shade}" stroke-width="2" stroke-linejoin="round">${shapes[kind] || shapes.tshirt}</g>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ----------------------- Varsayılan katalog ------------------------- */
function defaultData() {
  return {
    products: [
      { id: "tshirt-kum", name: "Oversize Tişört", category: "ust", type: "tshirt", color: "Kum", price: 649, stock: 24, visible: true, sizes: ["S","M","L","XL"], tags: ["günlük","spor","yaz"], desc: "beige oversize t-shirt", image: garmentSVG("#d8cbb4","#b9a988","tshirt") },
      { id: "gomlek-beyaz", name: "Keten Gömlek", category: "ust", type: "shirt", color: "Beyaz", price: 990, stock: 15, visible: true, sizes: ["S","M","L","XL"], tags: ["klasik","yaz","ofis"], desc: "white linen shirt", image: garmentSVG("#f4f2ec","#d9d5c9","shirt") },
      { id: "ceket-indigo", name: "Denim Ceket", category: "ust", type: "jacket", color: "İndigo", price: 1890, stock: 8, visible: true, sizes: ["S","M","L"], tags: ["günlük","klasik","dört mevsim"], desc: "indigo denim jacket", image: garmentSVG("#3f5a80","#2c3f5c","jacket") },
      { id: "hoodie-antrasit", name: "Kapüşonlu Sweat", category: "ust", type: "hoodie", color: "Antrasit", price: 1290, stock: 19, visible: true, sizes: ["S","M","L","XL"], tags: ["spor","günlük","kış"], desc: "charcoal hoodie", image: garmentSVG("#3a3a3e","#242427","hoodie") },
      { id: "jogger-haki", name: "Jogger Pantolon", category: "alt", type: "pants", color: "Haki", price: 1150, stock: 21, visible: true, sizes: ["S","M","L","XL"], tags: ["spor","günlük"], desc: "khaki jogger pants", image: garmentSVG("#7c7b53","#5d5c3c","pants") },
      { id: "chino-siyah", name: "Chino Pantolon", category: "alt", type: "pants", color: "Siyah", price: 1290, stock: 17, visible: true, sizes: ["S","M","L","XL"], tags: ["klasik","ofis"], desc: "black chino pants", image: garmentSVG("#2b2b2e","#161618","pants") },
      { id: "sort-bej", name: "Keten Şort", category: "alt", type: "shorts", color: "Bej", price: 690, stock: 26, visible: true, sizes: ["S","M","L","XL"], tags: ["yaz","spor"], desc: "beige linen shorts", image: garmentSVG("#ddd2ba","#bfb392","shorts") },
      { id: "etek-siyah", name: "Midi Etek", category: "alt", type: "skirt", color: "Siyah", price: 950, stock: 12, visible: true, sizes: ["S","M","L"], tags: ["klasik","ofis"], desc: "black midi skirt", image: garmentSVG("#26262a","#141416","skirt") },
    ],
    campaign: { code: "YAZ20", label: "Yaz İndirimi", percent: 20, active: true },
    settings: {
      geminiKey: "",
      geminiTextModel: "gemini-2.5-flash",
      geminiImageModel: "gemini-2.5-flash-image",
      tryonProvider: "idm-vton",   // 'idm-vton' (ücretsiz) | 'gemini' | 'local'
      hfSpace: "yisol/IDM-VTON",
    },
    cart: [],
    favs: [],
  };
}

/* ----------------------------- Kalıcılık ---------------------------- */
let data = load();

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...defaultData(), ...JSON.parse(raw) };
  } catch (_) {}
  return defaultData();
}
export function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("store:change"));
}
export function resetStore() { data = defaultData(); save(); }

/* Farklı sekmedeki değişikliği yakala */
window.addEventListener("storage", (e) => {
  if (e.key === LS_KEY) { data = load(); window.dispatchEvent(new CustomEvent("store:change")); }
});

/* ------------------------------- API -------------------------------- */
export const store = {
  /* ürünler */
  all: () => data.products,
  visible: () => data.products.filter((p) => p.visible && p.stock > 0),
  byId: (id) => data.products.find((p) => p.id === id),
  upsertProduct(p) {
    const i = data.products.findIndex((x) => x.id === p.id);
    if (i >= 0) data.products[i] = { ...data.products[i], ...p };
    else data.products.push(p);
    save();
  },
  removeProduct(id) { data.products = data.products.filter((p) => p.id !== id); save(); },

  /* kampanya */
  campaign: () => data.campaign,
  setCampaign(c) { data.campaign = { ...data.campaign, ...c }; save(); },

  /* ayarlar */
  settings: () => data.settings,
  setSettings(s) { data.settings = { ...data.settings, ...s }; save(); },

  /* sepet */
  cart: () => data.cart,
  addToCart(item) {
    const key = `${item.id}|${item.size}|${item.color}`;
    const ex = data.cart.find((c) => c.key === key);
    if (ex) ex.qty += item.qty || 1;
    else data.cart.push({ key, qty: item.qty || 1, ...item });
    save();
  },
  setQty(key, qty) {
    const c = data.cart.find((x) => x.key === key);
    if (c) c.qty = Math.max(1, qty);
    save();
  },
  removeFromCart(key) { data.cart = data.cart.filter((c) => c.key !== key); save(); },
  clearCart() { data.cart = []; save(); },
  cartTotal() {
    const sub = data.cart.reduce((s, c) => s + c.price * c.qty, 0);
    const camp = data.campaign;
    const disc = camp?.active ? Math.round(sub * camp.percent / 100) : 0;
    return { sub, disc, total: sub - disc };
  },

  /* favoriler */
  favs: () => data.favs,
  toggleFav(id) {
    data.favs = data.favs.includes(id) ? data.favs.filter((x) => x !== id) : [...data.favs, id];
    save();
  },
  isFav: (id) => data.favs.includes(id),
};

export function tl(n) { return "₺" + Number(n).toLocaleString("tr-TR"); }
