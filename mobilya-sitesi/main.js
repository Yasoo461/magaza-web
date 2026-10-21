// ---------- Siparişi Tamamla -> adres.html (en başta, hata olsa da çalışsın) ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".checkout-btn");
  if (!btn) return;

  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem("userCart")) || [];
  } catch (err) {}

  if (saved.length === 0) {
    alert("Sepetiniz boş. Önce bir ürün ekleyin.");
    return;
  }
  window.location.href = "adres.html";
});

// ---------- Yardımcılar ----------
const fmtTL = (n) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    n,
  );

const $ = (id) => document.getElementById(id);

// ---------- Mobil menü ----------
const menuBtn = $("menu-btn");
const navLinks = $("nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("active");
  menuBtn.querySelector("i").className = open
    ? "ri-close-line"
    : "ri-menu-line";
});

navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuBtn.querySelector("i").className = "ri-menu-line";
  }),
);

// ---------- Sepet ----------
const cartBtn = $("cart-btn");
const cartDropdown = $("cart-dropdown");
const cartItemsEl = $("cart-items");
const cartCountEl = $("cart-count");
const cartTotalEl = $("cart-total-price");

// Eski sürümden kalan sepet kaydını temizle
try {
  localStorage.removeItem("ozen-cart");
} catch (e) {}

// Ödeme tamamlandıysa (odeme.html -> index.html?siparis=tamam) sepeti sıfırla
if (new URLSearchParams(window.location.search).get("siparis") === "tamam") {
  try {
    localStorage.removeItem("userCart");
  } catch (e) {}
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.hash,
  );
}

let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("userCart")) || [];
} catch (e) {
  cart = [];
}

const saveCart = () => {
  try {
    localStorage.setItem("userCart", JSON.stringify(cart));
  } catch (e) {}
};

function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    const li = document.createElement("li");
    li.className = "cart-empty";
    li.textContent = "Sepetiniz boş.";
    cartItemsEl.appendChild(li);
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="cart-item-info">
        <strong></strong>
        <small>${fmtTL(item.price)}</small>
      </div>
      <div class="cart-item-qty">
        <button type="button" data-action="dec" data-id="${item.id}" aria-label="Azalt">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="inc" data-id="${item.id}" aria-label="Arttır">+</button>
        <button type="button" data-action="remove" data-id="${item.id}" aria-label="Sil">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>`;
    li.querySelector("strong").textContent = item.name; // XSS'e karşı textContent
    cartItemsEl.appendChild(li);
  });

  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.quantity * i.price, 0);
  cartCountEl.textContent = count;
  cartTotalEl.textContent = fmtTL(total);
  saveCart();
}

function addToCart({ id, name, price }) {
  const found = cart.find((i) => i.id === id);
  if (found) found.quantity += 1;
  else cart.push({ id, name, price, quantity: 1 });
  renderCart();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn || btn.disabled) return;
  addToCart({
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
  });
  const old = btn.textContent;
  btn.textContent = "Eklendi ✓";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = old;
    btn.disabled = false;
  }, 800);
});

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const item = cart.find((i) => i.id === btn.dataset.id);
  if (!item) return;

  if (btn.dataset.action === "inc") item.quantity += 1;
  if (btn.dataset.action === "dec") item.quantity -= 1;
  if (btn.dataset.action === "remove" || item.quantity <= 0)
    cart = cart.filter((i) => i.id !== item.id);

  renderCart();
});

cartBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = cartDropdown.classList.toggle("active");
  cartBtn.setAttribute("aria-expanded", open);
});

document.addEventListener("click", (e) => {
  if (!cartDropdown.contains(e.target) && !cartBtn.contains(e.target)) {
    cartDropdown.classList.remove("active");
    cartBtn.setAttribute("aria-expanded", "false");
  }
});

renderCart();

// Tarayıcının "geri" tuşuyla dönülünce sayfa önbellekten gelir; sepeti yeniden oku
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  try {
    cart = JSON.parse(localStorage.getItem("userCart")) || [];
  } catch (err) {
    cart = [];
  }
  renderCart();
});

// ---------- Ürün arama + kategori filtresi ----------
const searchInput = $("search-input");
const noResults = $("no-results");
let activeCategory = "all";

function filterProducts() {
  const q = searchInput.value.trim().toLocaleLowerCase("tr-TR");
  let visible = 0;
  document.querySelectorAll(".product__card").forEach((card) => {
    const cat = card.dataset.category || "";
    const name = (
      card.querySelector("h4").textContent +
      " " +
      cat
    ).toLocaleLowerCase("tr-TR");
    const show =
      name.includes(q) && (activeCategory === "all" || cat === activeCategory);
    card.style.display = show ? "" : "none";
    if (show) visible++;
  });
  noResults.hidden = visible > 0;
}

// Ürünü olmayan kategori butonlarını gizle
function updateCategoryChips() {
  const present = new Set(
    [...document.querySelectorAll(".product__card")].map(
      (c) => c.dataset.category || "",
    ),
  );
  document.querySelectorAll(".category-chip").forEach((chip) => {
    const c = chip.dataset.category;
    chip.hidden = c !== "all" && !present.has(c);
  });
  const activeChip = document.querySelector(
    `.category-chip[data-category="${activeCategory}"]`,
  );
  if (activeChip && activeChip.hidden) {
    activeCategory = "all";
    document
      .querySelectorAll(".category-chip")
      .forEach((c) =>
        c.classList.toggle("active", c.dataset.category === "all"),
      );
  }
}

const categoryBar = document.getElementById("category-bar");
if (categoryBar) {
  categoryBar.addEventListener("click", (e) => {
    const chip = e.target.closest(".category-chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    categoryBar
      .querySelectorAll(".category-chip")
      .forEach((c) => c.classList.toggle("active", c === chip));
    filterProducts();
  });
}
updateCategoryChips();

searchInput.addEventListener("input", filterProducts);
$("search-btn").addEventListener("click", () => {
  filterProducts();
  document.getElementById("product").scrollIntoView({ behavior: "smooth" });
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    filterProducts();
    document.getElementById("product").scrollIntoView({ behavior: "smooth" });
  }
});

// ---------- ScrollReveal ----------
if (typeof ScrollReveal !== "undefined") {
  const sr = ScrollReveal({
    distance: "40px",
    duration: 800,
    origin: "bottom",
  });
  sr.reveal(".header__content, .deals__card, .about__card, .product__card", {
    interval: 100,
  });
}

// ---------- Navbar: kaydırınca gölge + aktif bölüm vurgusu ----------
(function () {
  const nav = document.querySelector("header.navbar");
  if (!nav) return;

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const links = [...document.querySelectorAll(".nav-links .nav-item")];
  const map = new Map();
  links.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) map.set(target, a);
  });

  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          map.get(en.target).classList.add("active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  map.forEach((_, section) => io.observe(section));
})();

// ---------- Admin panelinden eklenen ürünler ----------
(function () {
  try {
    const KEY = "furniProducts"; // admin.js ile aynı anahtar
    const grid = document.querySelector(".product__grid");
    if (!grid) return;

    function loadAdminProducts() {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
      } catch (e) {
        return [];
      }
    }

    function el(tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }

    function renderAdminProducts() {
      grid
        .querySelectorAll('.product__card[data-admin="1"]')
        .forEach((c) => c.remove());

      loadAdminProducts().forEach((p) => {
        const card = el("div", "product__card");
        card.dataset.admin = "1";
        card.dataset.category = p.category || "";

        const img = document.createElement("img");
        img.src = p.image;
        img.alt = p.name;
        img.loading = "lazy";

        const btn = el("button", "add-to-cart-btn", "Sepete Ekle");
        btn.type = "button";
        btn.dataset.id = "admin-" + p.id;
        btn.dataset.name = p.name;
        btn.dataset.price = String(p.price);

        card.append(
          img,
          el("h4", "", p.name),
          el("p", "", fmtTL(Number(p.price))),
          btn,
        );
        if (p.description) card.title = p.description;
        grid.appendChild(card);
      });

      if (typeof updateCategoryChips === "function") updateCategoryChips();
      if (typeof filterProducts === "function") filterProducts();
    }

    renderAdminProducts();

    // Admin paneli başka sekmede açıkken yapılan değişiklikler anında yansısın
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) renderAdminProducts();
    });
  } catch (err) {
    console.error("Admin ürünleri yüklenemedi:", err);
  }
})();
