/* =====================================================================
   GEMINI ENTEGRASYONU (gemini.js)
   - geminiStylist(): stil danışmanı — gemini-2.5-flash (free tier'da bol)
   - geminiTryOn():   opsiyonel görsel giydirme — gemini-2.5-flash-image
   Anahtar panelden girilir ve store.settings.geminiKey içinde tutulur.
   Tarayıcıdan doğrudan REST çağrısı; SDK gerektirmez.
   ===================================================================== */
import { store } from "./store.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function key() {
  const k = store.settings().geminiKey?.trim();
  if (!k) throw new Error("Gemini API anahtarı yok. Panel → Ayarlar bölümünden ekleyin.");
  return k;
}

/* -------- Blob/File → base64 (data kısmı) -------- */
export function toBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

/* =====================================================================
   STİL DANIŞMANI — sadece stoktaki ürünlerden kombin
   Kullanıcı isteği + stok kataloğu → JSON { reply, outfit:[ids], note }
   ===================================================================== */
export async function geminiStylist(userText, history = []) {
  const s = store.settings();
  const catalog = store.visible().map((p) => ({
    id: p.id, name: p.name, category: p.category, color: p.color,
    price: p.price, tags: p.tags,
  }));

  const sys =
    "Sen bir moda mağazasının stil danışmanısın. SADECE aşağıdaki STOK kataloğundaki " +
    "ürünlerden kombin öner. Katalog dışı ürün ASLA önerme. Bir üst (category=ust) ve " +
    "bir alt (category=alt) seçerek uyumlu bir kombin kur. Türkçe, kısa ve samimi konuş.\n\n" +
    "STOK KATALOĞU (JSON):\n" + JSON.stringify(catalog) + "\n\n" +
    "Yanıtı SADECE şu JSON şemasıyla ver: " +
    '{"reply": "kısa açıklama", "outfit": ["urun_id","urun_id"], "note": "stil ipucu"}';

  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user", parts: [{ text: sys + "\n\nKULLANICI: " + userText }] },
  ];

  const url = `${BASE}/${s.geminiTextModel}:generateContent?key=${encodeURIComponent(key())}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    }),
  });
  if (!resp.ok) throw new Error("Gemini metin hatası: " + resp.status + " " + (await resp.text()).slice(0, 200));
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "{}";
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { parsed = { reply: text, outfit: [], note: "" }; }
  // sadece geçerli id'ler
  parsed.outfit = (parsed.outfit || []).filter((id) => store.byId(id));
  return parsed;
}

/* =====================================================================
   OPSİYONEL GÖRSEL GİYDİRME — Gemini 2.5 Flash Image (Nano Banana)
   Ücretli/kotalı olabilir; varsayılan try-on IDM-VTON'dur.
   person + garment görselleri → giydirilmiş sonuç (data URL)
   ===================================================================== */
export async function geminiTryOn(personBlob, garmentBlob, garmentDesc = "the garment") {
  const s = store.settings();
  const [pB64, gB64] = await Promise.all([toBase64(personBlob), toBase64(garmentBlob)]);
  const prompt =
    `Virtual try-on. Take the person in the first image and dress them in ${garmentDesc} ` +
    `shown in the second image. Keep the person's face, pose, body and background identical. ` +
    `Make the garment fit naturally and photorealistically. Output only the edited photo.`;

  const url = `${BASE}/${s.geminiImageModel}:generateContent?key=${encodeURIComponent(key())}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: personBlob.type || "image/jpeg", data: pB64 } },
          { inline_data: { mime_type: garmentBlob.type || "image/png", data: gB64 } },
        ],
      }],
    }),
  });
  if (!resp.ok) throw new Error("Gemini görsel hatası: " + resp.status + " " + (await resp.text()).slice(0, 200));
  const json = await resp.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData || p.inline_data);
  const inline = img?.inlineData || img?.inline_data;
  if (!inline) throw new Error("Gemini görsel döndürmedi (kota/free-tier sınırı olabilir).");
  return `data:${inline.mimeType || inline.mime_type || "image/png"};base64,${inline.data}`;
}
