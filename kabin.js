/* =====================================================================
   AI SANAL KABİN — "Üzerimde Dene" demo mantığı
   ---------------------------------------------------------------------
   İki katmanlı çalışır:
   1) YEREL GİYDİRME  → Kullanıcı ürünü kendi fotoğrafı üzerinde
      sürükler / ölçekler / döndürür. İnternet ve anahtar gerektirmez,
      sunumda ASLA çökmez. (Gerçek AI'ın UX'ini birebir gösterir.)
   2) GERÇEK AI       → IDM-VTON'un ücretsiz Hugging Face Space'ine
      (@gradio/client, /tryon) fotoğraf + ürün gönderir, gerçekçi
      giydirilmiş sonucu geri alır. Ücretsiz olduğu için kuyruğa
      girebilir; o yüzden yerel katman her zaman yedekte durur.

   NOT (lisans): IDM-VTON ağırlıkları araştırma/non-commercial lisanslı.
   Demoda/değerlendirmede kullanmak serbest; ticari teslimde FASHN/Kling
   gibi ticari bir API'ye veya lisanslı modele geçilmelidir.
   ===================================================================== */

/* ---------- Ürün kataloğu (gerçek mağazada panelden gelir) -----------
   image  : ürün kartı + giydirme katmanı için PNG/SVG.
   Gerçek AI için buraya mağazanın GERÇEK ürün fotoğrafını koyun;
   düz çizim SVG'ler AI'da zayıf sonuç verir ama akışı test eder.      */
const CATALOG = [
  {
    id: "tshirt-kum",
    name: "Oversize Tişört",
    color: "Kum",
    price: 649,
    category: "ust",
    desc: "shirt",
    tags: ["günlük", "spor", "yaz"],
    image: garmentSVG("#d8cbb4", "#b9a988", "tshirt"),
  },
  {
    id: "ceket-indigo",
    name: "Denim Ceket",
    color: "İndigo",
    price: 1890,
    category: "ust",
    desc: "denim jacket",
    tags: ["günlük", "klasik", "dört mevsim"],
    image: garmentSVG("#3f5a80", "#2c3f5c", "jacket"),
  },
  {
    id: "hoodie-antrasit",
    name: "Kapüşonlu Sweat",
    color: "Antrasit",
    price: 1290,
    category: "ust",
    desc: "hoodie",
    tags: ["spor", "günlük", "kış"],
    image: garmentSVG("#3a3a3e", "#242427", "hoodie"),
  },
  {
    id: "gomlek-beyaz",
    name: "Keten Gömlek",
    color: "Beyaz",
    price: 990,
    category: "ust",
    desc: "linen shirt",
    tags: ["klasik", "yaz", "ofis"],
    image: garmentSVG("#f4f2ec", "#d9d5c9", "shirt"),
  },
];

/* ------------------------- Ayarlar / durum -------------------------- */
const state = {
  humanURL: null,     // yüklenen kullanıcı fotoğrafı (objectURL)
  humanFile: null,    // yüklenen dosya (AI'a göndermek için)
  product: CATALOG[0],
  garment: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 },
  hfSpace: "yisol/IDM-VTON",
};

/* ------------------------------ DOM --------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const stage = $("#stage");
const humanImg = $("#human-img");
const garmentLayer = $("#garment-layer");
const emptyHint = $("#empty-hint");
const photoInput = $("#photo-input");
const productGrid = $("#product-grid");
const statusEl = $("#status");
const resultWrap = $("#ai-result");
const resultImg = $("#ai-result-img");

/* --------------------------- Ürün ızgarası -------------------------- */
function renderProducts() {
  productGrid.innerHTML = "";
  CATALOG.forEach((p) => {
    const card = document.createElement("button");
    card.className = "product-card" + (p.id === state.product.id ? " active" : "");
    card.type = "button";
    card.innerHTML = `
      <span class="product-thumb"><img src="${p.image}" alt="${p.name}"></span>
      <span class="product-meta">
        <b>${p.name}</b>
        <i>${p.color} · ${p.category === "ust" ? "Üst" : "Alt"}</i>
        <em>₺${p.price.toLocaleString("tr-TR")}</em>
      </span>`;
    card.addEventListener("click", () => selectProduct(p));
    productGrid.appendChild(card);
  });
}

function selectProduct(p) {
  state.product = p;
  state.garment = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 };
  renderProducts();
  paintGarment();
  hideAIResult();
}

/* --------------------- Yerel giydirme katmanı ----------------------- */
function paintGarment() {
  if (!state.humanURL) {
    garmentLayer.style.display = "none";
    return;
  }
  garmentLayer.style.display = "block";
  garmentLayer.style.backgroundImage = `url("${state.product.image}")`;
  const g = state.garment;
  garmentLayer.style.opacity = g.opacity;
  garmentLayer.style.transform =
    `translate(calc(-50% + ${g.x}px), calc(-50% + ${g.y}px)) ` +
    `scale(${g.scale}) rotate(${g.rotate}deg)`;
}

/* Sürükleme (fare + dokunma) */
let dragging = false;
let startPt = null;
function pointerDown(e) {
  if (!state.humanURL) return;
  dragging = true;
  const p = e.touches ? e.touches[0] : e;
  startPt = { x: p.clientX - state.garment.x, y: p.clientY - state.garment.y };
}
function pointerMove(e) {
  if (!dragging) return;
  const p = e.touches ? e.touches[0] : e;
  state.garment.x = p.clientX - startPt.x;
  state.garment.y = p.clientY - startPt.y;
  paintGarment();
}
function pointerUp() { dragging = false; }

garmentLayer.addEventListener("mousedown", pointerDown);
window.addEventListener("mousemove", pointerMove);
window.addEventListener("mouseup", pointerUp);
garmentLayer.addEventListener("touchstart", pointerDown, { passive: true });
window.addEventListener("touchmove", pointerMove, { passive: true });
window.addEventListener("touchend", pointerUp);

/* Kaydırıcılar */
$("#ctrl-scale").addEventListener("input", (e) => { state.garment.scale = +e.target.value; paintGarment(); });
$("#ctrl-rotate").addEventListener("input", (e) => { state.garment.rotate = +e.target.value; paintGarment(); });
$("#ctrl-opacity").addEventListener("input", (e) => { state.garment.opacity = +e.target.value; paintGarment(); });

/* ------------------------- Fotoğraf yükleme ------------------------- */
photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (state.humanURL) URL.revokeObjectURL(state.humanURL);
  state.humanFile = file;
  state.humanURL = URL.createObjectURL(file);
  humanImg.src = state.humanURL;
  humanImg.style.display = "block";
  emptyHint.style.display = "none";
  state.garment = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 };
  paintGarment();
  hideAIResult();
  setStatus("Fotoğraf yüklendi. Ürünü sürükleyip ölçekleyin ya da “Gerçek AI ile dene”ye basın.");
});

/* Örnek fotoğraf ile hızlı deneme (kişi görseli) */
$("#sample-photo").addEventListener("click", async () => {
  const url = samplePersonSVG();
  if (state.humanURL) URL.revokeObjectURL(state.humanURL);
  state.humanURL = url;
  state.humanFile = await (await fetch(url)).blob();
  humanImg.src = url;
  humanImg.style.display = "block";
  emptyHint.style.display = "none";
  state.garment = { x: 0, y: -10, scale: 1, rotate: 0, opacity: 0.92 };
  paintGarment();
  hideAIResult();
  setStatus("Örnek model yüklendi. Gerçek sonuç için kendi fotoğrafınızı yükleyin.");
});

/* ----------------------- İndir (yerel kompozit) --------------------- */
$("#download").addEventListener("click", async () => {
  if (!state.humanURL) return setStatus("Önce bir fotoğraf yükleyin.");
  const canvas = document.createElement("canvas");
  const W = 720, H = 960;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const human = await loadImg(state.humanURL);
  // örtücü (cover) yerleşim
  coverDraw(ctx, human, W, H);
  const garment = await loadImg(state.product.image);
  const g = state.garment;
  const rect = stage.getBoundingClientRect();
  const kx = W / rect.width, ky = H / rect.height;
  ctx.save();
  ctx.globalAlpha = g.opacity;
  ctx.translate(W / 2 + g.x * kx, H / 2 + g.y * ky);
  ctx.rotate((g.rotate * Math.PI) / 180);
  const gw = rect.width * 0.62 * g.scale * kx;
  const gh = gw * (garment.height / garment.width);
  ctx.drawImage(garment, -gw / 2, -gh / 2, gw, gh);
  ctx.restore();
  const a = document.createElement("a");
  a.download = `uzerimde-dene-${state.product.id}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
  setStatus("Görsel indirildi.");
});

/* ===================================================================
   GERÇEK AI — IDM-VTON (Hugging Face Space, ücretsiz)
   =================================================================== */
$("#try-ai").addEventListener("click", runAITryOn);

async function runAITryOn() {
  if (!state.humanFile) return setStatus("Gerçek AI için önce bir fotoğraf yükleyin.");
  setStatus("Gerçek AI motoru yükleniyor (IDM-VTON)… ücretsiz sunucu meşgulse kuyruğa girebilir.");
  toggleBusy(true);
  try {
    const { Client } = await import(
      "https://cdn.jsdelivr.net/npm/@gradio/client@1.5.2/dist/index.min.js"
    );
    const app = await Client.connect(state.hfSpace);
    const garmentBlob = await (await fetch(state.product.image)).blob();
    setStatus("Giydirme işleniyor… (birkaç saniye)");

    // /tryon imza sırası:
    // [ dict(imageEditor), garm_img, garment_des, is_checked(auto-mask),
    //   is_checked_crop, denoise_steps, seed ]
    const result = await app.predict("/tryon", [
      { background: state.humanFile, layers: [], composite: null },
      garmentBlob,
      state.product.desc,
      true,   // otomatik maske
      false,  // kırpma
      30,     // adım
      42,     // seed
    ]);

    const out = Array.isArray(result.data) ? result.data[0] : result.data;
    const src = out?.url || out?.path || (out && out[0]?.url);
    if (!src) throw new Error("Sonuç görseli alınamadı.");
    showAIResult(src);
    setStatus("Gerçek AI giydirme tamamlandı. ✔");
  } catch (err) {
    console.error(err);
    setStatus(
      "Ücretsiz AI sunucusuna şu an ulaşılamadı (kuyruk/bakım olabilir). " +
      "Yerel giydirme her zaman çalışır — ürünü sürükleyip ölçekleyin. " +
      "Canlı üründe FASHN/Kling gibi ticari API bu adımı %100 kararlı yapar."
    );
  } finally {
    toggleBusy(false);
  }
}

function showAIResult(src) {
  resultImg.src = src;
  resultWrap.hidden = false;
  resultWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function hideAIResult() { resultWrap.hidden = true; }

/* ----------------------------- Yardımcılar -------------------------- */
function setStatus(t) { statusEl.textContent = t; }
function toggleBusy(b) {
  document.body.classList.toggle("busy", b);
  $("#try-ai").disabled = b;
}
function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
function coverDraw(ctx, img, W, H) {
  const r = Math.max(W / img.width, H / img.height);
  const w = img.width * r, h = img.height * r;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

/* --------- Basit gömülü SVG ürün çizimleri (data URI) --------------- */
function garmentSVG(fill, shade, kind) {
  const shapes = {
    tshirt: `<path d="M60 40 L100 20 L140 20 L180 40 L210 70 L185 95 L165 80 L165 210 L75 210 L75 80 L55 95 L30 70 Z"/>`,
    shirt: `<path d="M60 40 L100 22 L140 22 L180 40 L208 72 L184 96 L166 82 L166 214 L74 214 L74 82 L56 96 L32 72 Z"/><line x1="120" y1="30" x2="120" y2="210" stroke="${shade}" stroke-width="3"/>`,
    hoodie: `<path d="M85 28 Q120 10 155 28 L188 46 L212 78 L186 102 L168 86 L168 214 L72 214 L72 86 L54 102 L28 78 L52 46 Z"/><path d="M95 30 Q120 60 145 30" fill="none" stroke="${shade}" stroke-width="6"/>`,
    jacket: `<path d="M62 40 L100 22 L140 22 L178 40 L206 72 L182 96 L168 84 L168 214 L120 214 L120 60 L120 214 L72 214 L72 84 L58 96 L34 72 Z"/><line x1="120" y1="40" x2="120" y2="214" stroke="${shade}" stroke-width="4"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <g fill="${fill}" stroke="${shade}" stroke-width="2" stroke-linejoin="round">${shapes[kind] || shapes.tshirt}</g>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function samplePersonSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#e9e7e0"/>
    <circle cx="300" cy="170" r="90" fill="#cbb89b"/>
    <rect x="230" y="250" width="140" height="60" rx="20" fill="#cbb89b"/>
    <path d="M170 340 Q300 300 430 340 L470 760 L130 760 Z" fill="#c9c4ba"/>
    <rect x="150" y="360" width="60" height="360" rx="26" fill="#c9c4ba"/>
    <rect x="390" y="360" width="60" height="360" rx="26" fill="#c9c4ba"/>
    <text x="300" y="792" font-family="sans-serif" font-size="16" fill="#77776f" text-anchor="middle">ÖRNEK MODEL — kendi fotoğrafınızı yükleyin</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ------------------------------ Başlat ------------------------------ */
renderProducts();
paintGarment();
setStatus("Fotoğraf yükleyin ya da örnek modelle deneyin.");
