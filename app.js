const body = document.body;
const loadingScreen = document.querySelector(".loading-screen");

window.addEventListener("load", () => {
  window.setTimeout(() => loadingScreen.classList.add("done"), 1100);
});

// Do not leave the interface blocked if a third-party asset responds slowly.
window.setTimeout(() => loadingScreen.classList.add("done"), 4500);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.13 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const colorButtons = document.querySelectorAll(".color");
const selectedColor = document.querySelector(".selected-color");
const cartColor = document.querySelector(".cart-color");
const colorNames = {
  black: "Siyah Smooth",
  oxblood: "Oxblood",
  olive: "Zeytin"
};

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    colorButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    const name = colorNames[button.dataset.color];
    selectedColor.textContent = name;
    const activeSize = document.querySelector(".size-options .active").textContent;
    cartColor.textContent = `${name} / ${activeSize}`;
  });
});

document.querySelectorAll(".size-options button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".size-options button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    cartColor.textContent = `${selectedColor.textContent} / ${button.textContent}`;
    document.querySelector(".mobile-buy p span").textContent = `FORGE 08 / ${button.textContent}`;
  });
});

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

document.querySelectorAll(".faq details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".faq details").forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

const cartDrawer = document.querySelector(".cart-drawer");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartButton = document.querySelector(".cart-button");
const cartCount = cartButton.querySelector("span");
const cartHeadCount = document.querySelector(".cart-head span");
const quantityLabel = document.querySelector(".quantity span");
const linePrice = document.querySelector(".line-price");
const totalPrice = document.querySelector(".cart-total strong");
const unitPrice = 7490;
let quantity = 1;
let hasCartItem = false;

function formatPrice(value) {
  return `₺${new Intl.NumberFormat("tr-TR").format(value)}`;
}

function updateCart() {
  quantityLabel.textContent = String(quantity);
  const visibleCount = hasCartItem ? String(quantity) : "0";
  cartCount.textContent = visibleCount;
  cartHeadCount.textContent = visibleCount;
  linePrice.textContent = formatPrice(unitPrice * quantity);
  totalPrice.textContent = formatPrice(unitPrice * quantity);
}

function openCart(addProduct = false) {
  if (addProduct) hasCartItem = true;
  updateCart();
  body.classList.add("cart-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  body.classList.remove("cart-open");
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

const soundButton = document.querySelector(".sound-button");
soundButton.addEventListener("click", () => {
  const active = soundButton.getAttribute("aria-pressed") !== "true";
  soundButton.setAttribute("aria-pressed", String(active));
});

const mobileBuy = document.querySelector(".mobile-buy");
const firstSection = document.querySelector(".experience");
new IntersectionObserver(
  ([entry]) => mobileBuy.classList.toggle("show", !entry.isIntersecting),
  { threshold: 0.15 }
).observe(firstSection);

const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const viewer = document.querySelector(".viewer");
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
