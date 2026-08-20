/* ================= YÖNETİM PANELİ (panel.js) ================= */
import { store, tl, resetStore, garmentSVG } from "./store.js";
import { geminiStylist } from "./gemini.js";

const $ = (s, r = document) => r.querySelector(s);

/* ------------------------------ Sekmeler ---------------------------- */
document.querySelectorAll(".ptab").forEach((t) =>
  t.addEventListener("click", () => {
    document.querySelectorAll(".ptab").forEach((x) => x.classList.toggle("active", x === t));
    document.querySelectorAll(".ptab-panel").forEach((p) => p.hidden = p.id !== "tab-" + t.dataset.tab);
  }));

/* ------------------------------ Ürünler ----------------------------- */
const tbody = $("#ptable tbody");

/* Ürün fotoğrafı yükleme (gizli global input) */
const photoUploader = document.createElement("input");
photoUploader.type = "file"; photoUploader.accept = "image/*"; photoUploader.hidden = true;
document.body.appendChild(photoUploader);
let uploadTargetId = null;
photoUploader.addEventListener("change", () => {
  const file = photoUploader.files[0]; if (!file || !uploadTargetId) return;
  const reader = new FileReader();
  reader.onload = () => { store.upsertProduct({ id: uploadTargetId, image: reader.result }); };
  reader.readAsDataURL(file);
  photoUploader.value = "";
});

function renderTable() {
  tbody.innerHTML = store.all().map((p) => `
    <tr data-id="${p.id}">
      <td class="pcell">
        <button class="thumb-btn" data-photo="${p.id}" title="Fotoğraf yükle"><img src="${p.image}" alt=""><span>Foto</span></button>
        <b>${p.name}</b>
      </td>
      <td>
        <select data-f="category">
          <option value="ust" ${p.category === "ust" ? "selected" : ""}>Üst</option>
          <option value="alt" ${p.category === "alt" ? "selected" : ""}>Alt</option>
        </select>
      </td>
      <td><input data-f="color" value="${p.color}" size="8"></td>
      <td><input data-f="price" type="number" value="${p.price}" size="6"></td>
      <td><input data-f="stock" type="number" value="${p.stock}" size="4"></td>
      <td><input data-f="visible" type="checkbox" ${p.visible ? "checked" : ""}></td>
      <td><button class="del" aria-label="Sil">Sil</button></td>
    </tr>`).join("");

  tbody.querySelectorAll("tr").forEach((tr) => {
    const id = tr.dataset.id;
    tr.querySelectorAll("[data-f]").forEach((el) =>
      el.addEventListener("change", () => {
        const f = el.dataset.f;
        let v = el.type === "checkbox" ? el.checked : el.value;
        if (f === "price" || f === "stock") v = Number(v);
        store.upsertProduct({ id, [f]: v });
      }));
    tr.querySelector(".del").addEventListener("click", () => {
      if (confirm("Ürün silinsin mi?")) store.removeProduct(id);
    });
    tr.querySelector("[data-photo]").addEventListener("click", () => {
      uploadTargetId = id; photoUploader.click();
    });
  });
}

$("#add-product").addEventListener("click", () => {
  const name = prompt("Ürün adı:", "Yeni Ürün");
  if (!name) return;
  const cat = confirm("Üst giyim mi? (İptal = Alt giyim)") ? "ust" : "alt";
  const id = "urun-" + Date.now();
  store.upsertProduct({
    id, name, category: cat, type: cat === "ust" ? "tshirt" : "pants",
    color: "Siyah", price: 999, stock: 10, visible: true,
    sizes: ["S", "M", "L", "XL"], tags: ["yeni"],
    desc: name, image: garmentSVG("#2b2b2e", "#161618", cat === "ust" ? "tshirt" : "pants"),
  });
});

/* ----------------------------- Kampanya ----------------------------- */
function loadCampaign() {
  const c = store.campaign();
  $("#c-label").value = c.label; $("#c-code").value = c.code;
  $("#c-percent").value = c.percent; $("#c-active").checked = c.active;
}
$("#c-save").addEventListener("click", () => {
  store.setCampaign({
    label: $("#c-label").value, code: $("#c-code").value,
    percent: Number($("#c-percent").value), active: $("#c-active").checked,
  });
  flash("#c-save", "Kaydedildi ✔");
});

/* ------------------------------ Ayarlar ----------------------------- */
function loadSettings() {
  const s = store.settings();
  $("#s-key").value = s.geminiKey; $("#s-provider").value = s.tryonProvider; $("#s-space").value = s.hfSpace;
}
$("#s-save").addEventListener("click", () => {
  store.setSettings({
    geminiKey: $("#s-key").value.trim(),
    tryonProvider: $("#s-provider").value,
    hfSpace: $("#s-space").value.trim(),
  });
  $("#s-status").textContent = "Ayarlar kaydedildi.";
  flash("#s-save", "Kaydedildi ✔");
});
$("#s-test").addEventListener("click", async () => {
  store.setSettings({ geminiKey: $("#s-key").value.trim() });
  $("#s-status").textContent = "Test ediliyor…";
  try {
    const r = await geminiStylist("merhaba, test");
    $("#s-status").textContent = "✔ Gemini bağlantısı çalışıyor. (yanıt alındı)";
  } catch (e) {
    $("#s-status").textContent = "⚠️ " + e.message;
  }
});
$("#reset").addEventListener("click", () => {
  if (confirm("Tüm demo verisi sıfırlansın mı?")) { resetStore(); renderTable(); loadCampaign(); loadSettings(); }
});

function flash(sel, txt) {
  const b = $(sel); const old = b.textContent; b.textContent = txt;
  setTimeout(() => (b.textContent = old), 1400);
}

/* ------------------------------- Başlat ----------------------------- */
window.addEventListener("store:change", renderTable);
renderTable(); loadCampaign(); loadSettings();
