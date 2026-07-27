import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const container = document.querySelector("#product-canvas");
const viewer = document.querySelector(".viewer");
const angleLabel = document.querySelector("#current-angle");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.25, 10.2);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const product = new THREE.Group();
product.rotation.x = -0.06;
scene.add(product);

const materials = {
  body: new THREE.MeshStandardMaterial({ color: 0x25282a, metalness: 0.92, roughness: 0.23 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xb6b8b4, metalness: 1, roughness: 0.13 }),
  cushion: new THREE.MeshStandardMaterial({ color: 0x101111, metalness: 0.03, roughness: 0.62 }),
  mesh: new THREE.MeshStandardMaterial({ color: 0x35393a, metalness: 0.72, roughness: 0.42 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xd9ff43, metalness: 0.1, roughness: 0.45 })
};

function addMesh(geometry, material, position, rotation = [0, 0, 0], parent = product) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Headband: layered torus arcs create a convincing premium over-ear silhouette.
const band = addMesh(
  new THREE.TorusGeometry(1.72, 0.12, 18, 70, Math.PI),
  materials.body,
  [0, 0.75, 0],
  [0, 0, 0]
);
band.scale.y = 1.22;

const bandTrim = addMesh(
  new THREE.TorusGeometry(1.72, 0.032, 10, 70, Math.PI),
  materials.trim,
  [0, 0.75, -0.105]
);
bandTrim.scale.y = 1.22;

const innerBand = addMesh(
  new THREE.TorusGeometry(1.47, 0.11, 16, 64, Math.PI),
  materials.cushion,
  [0, 0.69, 0.01]
);
innerBand.scale.y = 1.18;

function createEarCup(side) {
  const assembly = new THREE.Group();
  assembly.position.set(side * 1.64, -0.83, 0);
  assembly.rotation.z = side * -0.035;
  product.add(assembly);

  addMesh(new THREE.CylinderGeometry(0.68, 0.68, 0.32, 64), materials.body, [0, 0, 0], [Math.PI / 2, 0, 0], assembly);
  addMesh(new THREE.CylinderGeometry(0.55, 0.55, 0.345, 64), materials.mesh, [0, 0, -0.005], [Math.PI / 2, 0, 0], assembly);
  addMesh(new THREE.TorusGeometry(0.61, 0.04, 12, 64), materials.trim, [0, 0, 0.178], [0, 0, 0], assembly);
  addMesh(new THREE.TorusGeometry(0.7, 0.13, 20, 64), materials.cushion, [0, 0, -0.24], [0, 0, 0], assembly);
  addMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.37, 24), materials.accent, [side * -0.36, 0.5, 0], [Math.PI / 2, 0, 0], assembly);

  const yoke = addMesh(new THREE.TorusGeometry(0.85, 0.045, 10, 40, Math.PI * 0.78), materials.trim, [0, 0.25, 0], [0, 0, side > 0 ? 0.32 : -0.32], assembly);
  yoke.scale.y = 0.8;

  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    const dot = addMesh(
      new THREE.SphereGeometry(0.014, 6, 6),
      materials.trim,
      [Math.cos(angle) * 0.39, Math.sin(angle) * 0.39, 0.177],
      [0, 0, 0],
      assembly
    );
    dot.castShadow = false;
  }

  return assembly;
}

const leftCup = createEarCup(-1);
const rightCup = createEarCup(1);

// Articulated rails between headband and ear cups.
[-1, 1].forEach((side) => {
  addMesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), materials.trim, [side * 1.63, 0.12, 0]);
  addMesh(new THREE.BoxGeometry(0.18, 0.6, 0.17), materials.body, [side * 1.63, 0.23, 0]);
});

// Small tactile controls on the right cup.
addMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 20), materials.accent, [2.12, -0.78, 0.08], [0, 0, Math.PI / 2]);
addMesh(new THREE.BoxGeometry(0.08, 0.26, 0.07), materials.trim, [2.11, -1.04, 0.07], [0, 0, 0.02]);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.6, 70),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.16 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.15;
floor.receiveShadow = true;
scene.add(floor);

scene.add(new THREE.HemisphereLight(0xf6f2df, 0x353a34, 2.8));

const keyLight = new THREE.DirectionalLight(0xffffff, 5.5);
keyLight.position.set(-3.5, 5, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xd9ff43, 4.1);
rimLight.position.set(5, 1.5, -4);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x91a8ff, 22, 12);
fillLight.position.set(-4, -1, 2);
scene.add(fillLight);

let rotationY = -0.25;
let targetRotationY = rotationY;
let velocity = 0;
let isDragging = false;
let previousX = 0;
let autoRotate = true;
let lastInteraction = performance.now();

function pointerDown(event) {
  isDragging = true;
  previousX = event.clientX;
  velocity = 0;
  lastInteraction = performance.now();
  viewer.classList.add("is-dragging");
  viewer.setPointerCapture(event.pointerId);
}

function pointerMove(event) {
  if (!isDragging) return;
  const delta = event.clientX - previousX;
  previousX = event.clientX;
  velocity = delta * 0.0055;
  targetRotationY += velocity;
  lastInteraction = performance.now();
}

function pointerUp(event) {
  isDragging = false;
  viewer.classList.remove("is-dragging");
  if (viewer.hasPointerCapture(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
}

viewer.addEventListener("pointerdown", pointerDown);
viewer.addEventListener("pointermove", pointerMove);
viewer.addEventListener("pointerup", pointerUp);
viewer.addEventListener("pointercancel", pointerUp);

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < 600 ? 10.9 : 10.2;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();

function render() {
  requestAnimationFrame(render);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (!isDragging) {
    targetRotationY += velocity;
    velocity *= 0.92;
    if (autoRotate && performance.now() - lastInteraction > 1800) {
      targetRotationY += delta * 0.23;
    }
  }

  rotationY += (targetRotationY - rotationY) * 0.09;
  product.rotation.y = rotationY;
  product.position.y = Math.sin(performance.now() * 0.0007) * 0.035;

  const degrees = ((THREE.MathUtils.radToDeg(rotationY) % 360) + 360) % 360;
  angleLabel.textContent = String(Math.round(degrees)).padStart(3, "0");

  renderer.render(scene, camera);
}

render();

document.querySelectorAll(".color").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".color").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    const colors = {
      graphite: [0x25282a, 0xb6b8b4, 0x101111],
      silver: [0xb9bbb8, 0xeeeeea, 0x50514f],
      copper: [0x9f5d3d, 0xe0a07a, 0x2d211d]
    };
    const selected = colors[button.dataset.color];
    materials.body.color.setHex(selected[0]);
    materials.trim.color.setHex(selected[1]);
    materials.cushion.color.setHex(selected[2]);
    const colorName = button.querySelector("span").textContent;
    document.querySelector(".selected-color").textContent = colorName;
    document.querySelector(".cart-color").textContent =
      colorName.charAt(0) + colorName.slice(1).toLocaleLowerCase("tr-TR");
  });
});

const autoRotateButton = document.querySelector("#auto-rotate");
autoRotateButton.addEventListener("click", () => {
  autoRotate = !autoRotate;
  autoRotateButton.setAttribute("aria-pressed", String(autoRotate));
  lastInteraction = performance.now();
});

document.querySelector("#reset-view").addEventListener("click", () => {
  targetRotationY = -0.25;
  velocity = 0;
  lastInteraction = performance.now();
});

document.querySelector("#fullscreen").addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await viewer.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
  window.setTimeout(resize, 100);
});

const detailCard = document.querySelector(".detail-card");
const detailTitle = detailCard.querySelector("h2");
const detailText = detailCard.querySelector("p");
const details = [
  {
    title: "Tek parça alüminyum yapı.",
    text: "Hafiflik ve dayanıklılık için hassas işlenmiş gövde. Her yüzey elde fırçalanır."
  },
  {
    title: "Ortamı dinleyen sessizlik.",
    text: "Dört mikrofon çevresel sesi gerçek zamanlı analiz eder ve izolasyon seviyesini otomatik ayarlar."
  }
];

document.querySelectorAll(".hotspot").forEach((hotspot, index) => {
  hotspot.querySelector("button").addEventListener("click", () => {
    targetRotationY = THREE.MathUtils.degToRad(Number(hotspot.dataset.angle));
    velocity = 0;
    lastInteraction = performance.now();
    detailTitle.textContent = details[index].title;
    detailText.textContent = details[index].text;
    detailCard.classList.add("show");
  });
});

detailCard.querySelector("button").addEventListener("click", () => detailCard.classList.remove("show"));

const soundButton = document.querySelector(".sound-button");
soundButton.addEventListener("click", () => {
  const active = soundButton.getAttribute("aria-pressed") !== "true";
  soundButton.setAttribute("aria-pressed", String(active));
});

const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
let mouseX = -100;
let mouseY = -100;
let ringX = -100;
let ringY = -100;

window.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
});

function moveCursor() {
  ringX += (mouseX - ringX) * 0.14;
  ringY += (mouseY - ringY) * 0.14;
  cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  requestAnimationFrame(moveCursor);
}
moveCursor();

viewer.addEventListener("mouseenter", () => cursorRing.classList.add("drag-mode"));
viewer.addEventListener("mouseleave", () => cursorRing.classList.remove("drag-mode"));

window.addEventListener("load", () => {
  window.setTimeout(() => document.querySelector(".loading-screen").classList.add("done"), 800);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.13 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const cartDrawer = document.querySelector(".cart-drawer");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartButton = document.querySelector(".cart-button");
const cartCount = cartButton.querySelector("span");
const cartHeadCount = document.querySelector(".cart-head span");
const quantityLabel = document.querySelector(".quantity span");
const linePrice = document.querySelector(".line-price");
const totalPrice = document.querySelector(".cart-total strong");
const unitPrice = 18900;
let quantity = 1;
let hasCartItem = false;

function formatPrice(value) {
  return `₺${new Intl.NumberFormat("tr-TR").format(value)}`;
}

function updateCart() {
  quantityLabel.textContent = String(quantity);
  cartCount.textContent = hasCartItem ? String(quantity) : "0";
  cartHeadCount.textContent = hasCartItem ? String(quantity) : "0";
  linePrice.textContent = formatPrice(unitPrice * quantity);
  totalPrice.textContent = formatPrice(unitPrice * quantity);
}

function openCart(addProduct = false) {
  if (addProduct) hasCartItem = true;
  updateCart();
  document.body.classList.add("cart-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  document.body.classList.remove("cart-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".buy-trigger").forEach((button) => {
  button.addEventListener("click", () => openCart(true));
});

cartButton.addEventListener("click", () => openCart(false));
document.querySelector(".cart-close").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

document.querySelector(".quantity").addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  quantity = action === "plus" ? quantity + 1 : Math.max(1, quantity - 1);
  hasCartItem = true;
  updateCart();
});

document.querySelectorAll(".faq details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".faq details").forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

const mobileBuy = document.querySelector(".mobile-buy");
const firstSection = document.querySelector(".experience");

const buyBarObserver = new IntersectionObserver(
  ([entry]) => mobileBuy.classList.toggle("show", !entry.isIntersecting),
  { threshold: 0.15 }
);
buyBarObserver.observe(firstSection);

const wishlistButton = document.querySelector(".wishlist");
wishlistButton.addEventListener("click", () => {
  const active = wishlistButton.getAttribute("aria-pressed") === "true";
  wishlistButton.setAttribute("aria-pressed", String(!active));
  wishlistButton.innerHTML = active
    ? "<span>♡</span> FAVORİLERE EKLE"
    : "<span>♥</span> FAVORİLERE EKLENDİ";
});

document.querySelectorAll(".purchase-benefits details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    detail.querySelector("summary i").textContent = detail.open ? "−" : "+";
  });
});
