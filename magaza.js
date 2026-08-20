/* ================= MAĞAZA (magaza.js) ================= */
import { store, tl } from "./store.js";
import { geminiStylist } from "./gemini.js";

const $ = (s, r = document) => r.querySelector(s);
const grid = $("#grid");
let filter = "all";

/* ------------------------- Ürün ızgarası ------------------------- */
function renderGrid() {
  const items = store.visible().filter((p) => filter === "all" || p.category === filter);
  grid.innerHTML = items.map(cardHTML).join("") ||
    `<p class="empty">Bu kategoride görünür ürün yok.</p>`;
  grid.querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", (e) => {
      if (e.target.closest(".fav")) return;
      openProduct(el.dataset.id);
    }));
  grid.querySelectorAll(".fav").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      store.toggleFav(el.dataset.id);
    }));
}

function cardHTML(p) {
  const fav = store.isFav(p.id) ? "♥ on" : "♡";
  return `<article class="card" data-id="${p.id}">
    <div class="card-thumb"><img src="${p.image}" alt="${p.name}"></div>
    <button class="fav ${store.isFav(p.id) ? "on" : ""}" data-id="${p.id}" aria-label="Favori">${store.isFav(p.id) ? "♥" : "♡"}</button>
    <div class="card-body">
      <b>${p.name}</b>
      <i>${p.color}</i>
      <em>${tl(p.price)}</em>
    </div>
  </article>`;
}

/* --------------------------- Ürün modalı ------------------------- */
const modal = $("#product-modal");
const modalBackdrop = $("#modal-backdrop");
let modalState = null;

function openProduct(id, preset = {}) {
  const p = store.byId(id);
  if (!p) return;
  modalState = { id, size: preset.size || p.sizes[0], color: p.color, qty: 1 };
  modal.innerHTML = `
    <button class="modal-close" aria-label="Kapat">×</button>
    <div class="modal-visual"><img src="${p.image}" alt="${p.name}"></div>
    <div class="modal-info">
      <p class="m-cat">${p.category === "ust" ? "ÜST GİYİM" : "ALT GİYİM"} · ${p.color}</p>
      <h2>${p.name}</h2>
      <p class="m-price">${tl(p.price)}</p>
      <p class="m-stock">${p.stock > 0 ? "Stokta · " + p.stock + " adet" : "Tükendi"}</p>
      <div class="m-choose"><span>BEDEN</span>
        <div class="sizes">${p.sizes.map((s) => `<button type="button" data-size="${s}" class="${s === modalState.size ? "active" : ""}">${s}</button>`).join("")}</div>
      </div>
      <div class="m-actions">
        <button class="btn primary" id="m-add">Sepete ekle</button>
        <a class="btn ghost" id="m-tryon" href="kabin.html?p=${p.id}">Üzerimde dene</a>
        <button class="btn ghost fav-lg ${store.isFav(p.id) ? "on" : ""}" id="m-fav">${store.isFav(p.id) ? "♥ Favoride" : "♡ Favori"}</button>
      </div>
    </div>`;
  modal.querySelectorAll(".sizes button").forEach((b) =>
    b.addEventListener("click", () => {
      modalState.size = b.dataset.size;
      modal.querySelectorAll(".sizes button").forEach((x) => x.classList.toggle("active", x === b));
    }));
  $("#m-add", modal).addEventListener("click", () => {
    store.addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, size: modalState.size, color: p.color, qty: 1 });
    closeProduct(); openCart();
  });
  $("#m-fav", modal).addEventListener("click", () => { store.toggleFav(p.id); openProduct(id, modalState); });
  modal.querySelector(".modal-close").addEventListener("click", closeProduct);
  modal.hidden = false; modalBackdrop.hidden = false;
}
function closeProduct() { modal.hidden = true; modalBackdrop.hidden = true; }
modalBackdrop.addEventListener("click", closeProduct);

/* ------------------------------ Sepet ---------------------------- */
const cartDrawer = $("#cart-drawer");
const cartBackdrop = $("#cart-backdrop");
function openCart() { document.body.classList.add("cart-open"); cartDrawer.setAttribute("aria-hidden", "false"); renderCart(); }
function closeCart() { document.body.classList.remove("cart-open"); cartDrawer.setAttribute("aria-hidden", "true"); }
$("#cart-btn").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

function renderCart() {
  const lines = store.cart();
  const wrap = $("#cart-lines");
  if (!lines.length) { wrap.innerHTML = `<p class="empty">Sepetiniz boş.</p>`; $("#cart-summary").innerHTML = ""; return; }
  wrap.innerHTML = lines.map((c) => `
    <div class="cline">
      <span class="cline-thumb"><img src="${c.image}" alt=""></span>
      <div><b>${c.name}</b><i>${c.color} / ${c.size}</i>
        <div class="qty"><button data-k="${c.key}" data-d="-1">−</button><span>${c.qty}</span><button data-k="${c.key}" data-d="1">+</button></div>
      </div>
      <div class="cline-end"><strong>${tl(c.price * c.qty)}</strong><button class="crm" data-k="${c.key}" aria-label="Kaldır">Kaldır</button></div>
    </div>`).join("");
  wrap.querySelectorAll(".qty button").forEach((b) =>
    b.addEventListener("click", () => {
      const c = store.cart().find((x) => x.key === b.dataset.k);
      store.setQty(b.dataset.k, c.qty + Number(b.dataset.d));
    }));
  wrap.querySelectorAll(".crm").forEach((b) => b.addEventListener("click", () => store.removeFromCart(b.dataset.k)));
  const t = store.cartTotal();
  const camp = store.campaign();
  $("#cart-summary").innerHTML = `
    <p><span>Ara toplam</span><strong>${tl(t.sub)}</strong></p>
    ${t.disc ? `<p class="disc"><span>${camp.label} (${camp.code} · %${camp.percent})</span><strong>−${tl(t.disc)}</strong></p>` : ""}
    <p class="grand"><span>TOPLAM</span><strong>${tl(t.total)}</strong></p>
    <button class="btn primary wide" id="checkout">Güvenli ödemeye geç</button>`;
  $("#checkout").addEventListener("click", () => {
    alert("Demo: ödeme adımı entegrasyonu (iyzico/Stripe) canlı sürümde bağlanır.");
  });
}

/* --------------------------- Favori sayacı ----------------------- */
function renderCounts() {
  $("#cart-count").textContent = store.cart().reduce((s, c) => s + c.qty, 0);
  $("#cart-head-count").textContent = store.cart().reduce((s, c) => s + c.qty, 0);
  $("#fav-count").textContent = store.favs().length;
}
$("#fav-btn").addEventListener("click", () => {
  filter = "all";
  document.querySelectorAll("#filters .chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === "all"));
  const favs = store.favs();
  const items = store.visible().filter((p) => favs.includes(p.id));
  grid.innerHTML = items.length ? items.map(cardHTML).join("") : `<p class="empty">Henüz favoriniz yok.</p>`;
  bindGrid();
  window.scrollTo({ top: 300, behavior: "smooth" });
});
function bindGrid() {
  grid.querySelectorAll(".card").forEach((el) => el.addEventListener("click", (e) => { if (e.target.closest(".fav")) return; openProduct(el.dataset.id); }));
  grid.querySelectorAll(".fav").forEach((el) => el.addEventListener("click", (e) => { e.stopPropagation(); store.toggleFav(el.dataset.id); }));
}

/* --------------------------- Filtreler --------------------------- */
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  filter = b.dataset.cat;
  document.querySelectorAll("#filters .chip").forEach((c) => c.classList.toggle("active", c === b));
  renderGrid();
});

/* ======================= AI STİL DANIŞMANI ======================= */
const stylist = $("#stylist");
const log = $("#stylist-log");
const history = [];

$("#stylist-fab").addEventListener("click", () => { stylist.hidden = false; if (!log.children.length) botSay("Merhaba! Nasıl bir kombin istersin? (örn. spor, ofis, yazlık)"); });
$("#stylist-close").addEventListener("click", () => stylist.hidden = true);
$("#stylist-form").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#stylist-input").value.trim(); if (v) ask(v); $("#stylist-input").value = ""; });
stylist.querySelectorAll(".stylist-suggest button").forEach((b) => b.addEventListener("click", () => ask(b.dataset.q)));

function botSay(html, cls = "") { const d = document.createElement("div"); d.className = "msg bot " + cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
function userSay(t) { const d = document.createElement("div"); d.className = "msg user"; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }

async function ask(text) {
  userSay(text);
  history.push({ role: "user", text });
  const thinking = botSay("<i>düşünüyor…</i>", "thinking");
  try {
    const res = await geminiStylist(text, history.slice(0, -1));
    thinking.remove();
    const outfit = res.outfit.map((id) => store.byId(id)).filter(Boolean);
    let html = `<p>${escapeHTML(res.reply || "İşte bir öneri:")}</p>`;
    if (outfit.length) {
      html += `<div class="combo">` + outfit.map((p) => `
        <a class="combo-item" href="kabin.html?p=${p.id}">
          <img src="${p.image}" alt="${p.name}"><span>${p.name}</span><em>${tl(p.price)}</em>
        </a>`).join("") + `</div>`;
      if (res.note) html += `<p class="note-sm">💡 ${escapeHTML(res.note)}</p>`;
      const ids = outfit.map((p) => p.id).join(",");
      html += `<div class="combo-actions">
        <a class="btn ai sm" href="kabin.html?p=${outfit[0].id}&combo=${ids}">Bu kombini üzerimde dene</a>
        <button class="btn ghost sm" data-add="${ids}">Kombini sepete ekle</button></div>`;
    }
    const node = botSay(html);
    node.querySelector("[data-add]")?.addEventListener("click", (e) => {
      e.target.getAttribute("data-add").split(",").forEach((id) => {
        const p = store.byId(id);
        if (p) store.addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, size: p.sizes[0], color: p.color, qty: 1 });
      });
      openCart();
    });
    history.push({ role: "model", text: res.reply || "" });
  } catch (err) {
    thinking.remove();
    botSay(`⚠️ ${escapeHTML(err.message)}<br><small>Panel → Ayarlar'dan Gemini API anahtarınızı girin (ücretsiz: aistudio.google.com).</small>`, "err");
  }
}
function escapeHTML(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* --------------------------- Başlat ------------------------------ */
window.addEventListener("store:change", () => { renderGrid(); renderCounts(); if (cartDrawer.getAttribute("aria-hidden") === "false") renderCart(); });
renderGrid(); renderCounts();
