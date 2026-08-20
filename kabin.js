/* =====================================================================
   AI SANAL KABİN — "Üzerimde Dene"
   Ortak store'dan katalog + ayar okur. Try-on sağlayıcısı panelden seçilir:
     - idm-vton : ücretsiz Hugging Face Space (varsayılan)
     - gemini   : Gemini 2.5 Flash Image (kaliteli, kotalı/ücretli)
     - local    : yerel giydirme (internet gerekmez)
   Yerel katman her zaman elde; sağlayıcı başarısızsa demo yine çalışır.
   ===================================================================== */
import { store, tl } from "./store.js";
import { geminiTryOn } from "./gemini.js";

const $ = (s, r = document) => r.querySelector(s);

const state = {
  humanURL: null, humanFile: null,
  product: null,
  garment: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 },
};

const stage = $("#stage");
const humanImg = $("#human-img");
const garmentLayer = $("#garment-layer");
const emptyHint = $("#empty-hint");
const photoInput = $("#photo-input");
const productGrid = $("#product-grid");
const statusEl = $("#status");
const resultWrap = $("#ai-result");
const resultImg = $("#ai-result-img");

/* ------- URL'den ön-seçim (mağaza / stil danışmanından gelir) ------- */
const params = new URLSearchParams(location.search);
const presetId = params.get("p");

/* --------------------------- Ürün ızgarası -------------------------- */
function renderProducts() {
  const items = store.visible();
  state.product = state.product || store.byId(presetId) || items[0];
  productGrid.innerHTML = items.map((p) => `
    <button class="product-card ${p.id === state.product?.id ? "active" : ""}" type="button" data-id="${p.id}">
      <span class="product-thumb"><img src="${p.image}" alt="${p.name}"></span>
      <span class="product-meta"><b>${p.name}</b><i>${p.color} · ${p.category === "ust" ? "Üst" : "Alt"}</i><em>${tl(p.price)}</em></span>
    </button>`).join("");
  productGrid.querySelectorAll(".product-card").forEach((c) =>
    c.addEventListener("click", () => selectProduct(store.byId(c.dataset.id))));
}
function selectProduct(p) {
  state.product = p;
  state.garment = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 };
  renderProducts(); paintGarment(); hideAIResult();
}

/* ------------------------ Yerel giydirme --------------------------- */
function paintGarment() {
  if (!state.humanURL || !state.product) { garmentLayer.style.display = "none"; return; }
  garmentLayer.style.display = "block";
  garmentLayer.style.backgroundImage = `url("${state.product.image}")`;
  const g = state.garment;
  garmentLayer.style.opacity = g.opacity;
  garmentLayer.style.transform = `translate(calc(-50% + ${g.x}px), calc(-50% + ${g.y}px)) scale(${g.scale}) rotate(${g.rotate}deg)`;
}

let dragging = false, startPt = null;
function pDown(e) { if (!state.humanURL) return; dragging = true; const p = e.touches ? e.touches[0] : e; startPt = { x: p.clientX - state.garment.x, y: p.clientY - state.garment.y }; }
function pMove(e) { if (!dragging) return; const p = e.touches ? e.touches[0] : e; state.garment.x = p.clientX - startPt.x; state.garment.y = p.clientY - startPt.y; paintGarment(); }
function pUp() { dragging = false; }
garmentLayer.addEventListener("mousedown", pDown);
window.addEventListener("mousemove", pMove);
window.addEventListener("mouseup", pUp);
garmentLayer.addEventListener("touchstart", pDown, { passive: true });
window.addEventListener("touchmove", pMove, { passive: true });
window.addEventListener("touchend", pUp);

$("#ctrl-scale").addEventListener("input", (e) => { state.garment.scale = +e.target.value; paintGarment(); });
$("#ctrl-rotate").addEventListener("input", (e) => { state.garment.rotate = +e.target.value; paintGarment(); });
$("#ctrl-opacity").addEventListener("input", (e) => { state.garment.opacity = +e.target.value; paintGarment(); });

/* ------------------------- Fotoğraf yükleme ------------------------- */
photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (state.humanURL) URL.revokeObjectURL(state.humanURL);
  state.humanFile = file; state.humanURL = URL.createObjectURL(file);
  humanImg.src = state.humanURL; humanImg.style.display = "block"; emptyHint.style.display = "none";
  state.garment = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 };
  paintGarment(); hideAIResult();
  setStatus("Fotoğraf yüklendi. Ürünü sürükleyin ya da “Gerçek AI ile dene”ye basın.");
});

$("#sample-photo").addEventListener("click", async () => {
  const url = samplePersonSVG();
  if (state.humanURL) URL.revokeObjectURL(state.humanURL);
  state.humanURL = url; state.humanFile = await (await fetch(url)).blob();
  humanImg.src = url; humanImg.style.display = "block"; emptyHint.style.display = "none";
  state.garment = { x: 0, y: -10, scale: 1, rotate: 0, opacity: 0.92 };
  paintGarment(); hideAIResult();
  setStatus("Örnek model yüklendi. Gerçek sonuç için kendi fotoğrafınızı yükleyin.");
});

/* --------------------------- İndir --------------------------------- */
$("#download").addEventListener("click", async () => {
  if (!state.humanURL) return setStatus("Önce bir fotoğraf yükleyin.");
  const canvas = document.createElement("canvas");
  const W = 720, H = 960; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  coverDraw(ctx, await loadImg(state.humanURL), W, H);
  const garment = await loadImg(state.product.image);
  const g = state.garment, rect = stage.getBoundingClientRect();
  const kx = W / rect.width, ky = H / rect.height;
  ctx.save(); ctx.globalAlpha = g.opacity;
  ctx.translate(W / 2 + g.x * kx, H / 2 + g.y * ky); ctx.rotate((g.rotate * Math.PI) / 180);
  const gw = rect.width * 0.62 * g.scale * kx, gh = gw * (garment.height / garment.width);
  ctx.drawImage(garment, -gw / 2, -gh / 2, gw, gh); ctx.restore();
  const a = document.createElement("a"); a.download = `uzerimde-dene-${state.product.id}.png`;
  a.href = canvas.toDataURL("image/png"); a.click();
  setStatus("Görsel indirildi.");
});

/* ======================= GERÇEK AI GİYDİRME ======================== */
$("#try-ai").addEventListener("click", runAITryOn);

async function runAITryOn() {
  if (!state.humanFile) return setStatus("Gerçek AI için önce bir fotoğraf yükleyin.");
  const provider = store.settings().tryonProvider;
  if (provider === "local") return setStatus("Sağlayıcı 'yerel' seçili — ürünü sürükleyip ölçekleyin. (Panel → AI Ayarları)");
  toggleBusy(true);
  try {
    const garmentBlob = await (await fetch(state.product.image)).blob();
    if (provider === "gemini") {
      setStatus("Gemini görsel giydirme çalışıyor…");
      const src = await geminiTryOn(state.humanFile, garmentBlob, state.product.desc);
      showAIResult(src); setStatus("Gemini giydirme tamamlandı. ✔");
    } else {
      await idmVtonTryOn(garmentBlob);
    }
  } catch (err) {
    console.error(err);
    setStatus("AI sağlayıcısına ulaşılamadı: " + err.message +
      " — Yerel giydirme her zaman çalışır. Canlı üründe FASHN/Kling ile %100 kararlı.");
  } finally { toggleBusy(false); }
}

async function idmVtonTryOn(garmentBlob) {
  setStatus("IDM-VTON yükleniyor (ücretsiz sunucu meşgulse kuyruğa girer)…");
  const { Client } = await import("https://cdn.jsdelivr.net/npm/@gradio/client@1.5.2/dist/index.min.js");
  const app = await Client.connect(store.settings().hfSpace);
  setStatus("Giydirme işleniyor… (birkaç saniye)");
  const result = await app.predict("/tryon", [
    { background: state.humanFile, layers: [], composite: null },
    garmentBlob, state.product.desc, true, false, 30, 42,
  ]);
  const out = Array.isArray(result.data) ? result.data[0] : result.data;
  const src = out?.url || out?.path || (out && out[0]?.url);
  if (!src) throw new Error("Sonuç görseli alınamadı.");
  showAIResult(src); setStatus("IDM-VTON giydirme tamamlandı. ✔");
}

function showAIResult(src) { resultImg.src = src; resultWrap.hidden = false; resultWrap.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
function hideAIResult() { resultWrap.hidden = true; }

/* ----------------------------- Yardımcılar -------------------------- */
function setStatus(t) { statusEl.textContent = t; }
function toggleBusy(b) { document.body.classList.toggle("busy", b); $("#try-ai").disabled = b; }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function coverDraw(ctx, img, W, H) { const r = Math.max(W / img.width, H / img.height); const w = img.width * r, h = img.height * r; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }

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
window.addEventListener("store:change", () => renderProducts());
renderProducts(); paintGarment();
const prov = store.settings().tryonProvider;
setStatus(`Fotoğraf yükleyin ya da örnek modelle deneyin. (AI sağlayıcı: ${prov})`);
