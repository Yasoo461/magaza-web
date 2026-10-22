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
  const total = document.querySelectorAll(".product__card").length;
  noResults.hidden = visible > 0 || total === 0;
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

// ---------- Admin panelinden eklenen ürünler (çoklu fotoğraf + renk) ----------
(function () {
  try {
    const KEY = "furniProducts"; // admin.js ile aynı anahtar
    const grid = document.querySelector(".product__grid");
    if (!grid) return;

    let byId = new Map();
    let modal = null;
    let lastFocus = null;
    const state = { p: null, imgs: [], colors: [], img: 0, color: null };

    function loadAdminProducts() {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
      } catch (e) {
        return [];
      }
    }

    const imagesOf = (p) =>
      Array.isArray(p.images) && p.images.length
        ? p.images
        : p.image
          ? [p.image]
          : [];
    const colorsOf = (p) =>
      Array.isArray(p.colors) ? p.colors.filter((c) => c && c.name) : [];
    const hexOf = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : "#cccccc");

    function el(tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }

    /* ---------- Kartlar ---------- */
    function renderAdminProducts() {
      grid
        .querySelectorAll('.product__card[data-admin="1"]')
        .forEach((c) => c.remove());
      byId = new Map();

      loadAdminProducts().forEach((p) => {
        const imgs = imagesOf(p);
        const colors = colorsOf(p);
        byId.set(String(p.id), p);

        const card = el("div", "product__card");
        card.dataset.admin = "1";
        card.dataset.category = p.category || "";
        card.dataset.productId = String(p.id);

        const img = document.createElement("img");
        img.src = imgs[0] || "";
        img.alt = p.name;
        img.loading = "lazy";

        card.append(
          img,
          el("h4", "", p.name),
          el("p", "", fmtTL(Number(p.price))),
        );

        if (imgs.length > 1)
          card.append(el("span", "photo-count", `${imgs.length} fotoğraf`));

        if (colors.length) {
          const dots = el("div", "card-colors");
          colors.slice(0, 6).forEach((c) => {
            const d = el("span", "color-dot");
            d.style.background = hexOf(c.hex);
            d.title = c.name;
            dots.appendChild(d);
          });
          if (colors.length > 6)
            dots.appendChild(el("span", "color-more", `+${colors.length - 6}`));
          card.appendChild(dots);
        }

        let btn;
        if (colors.length) {
          btn = el("button", "view-options-btn", "Seçenekleri Gör");
          btn.type = "button";
        } else {
          btn = el("button", "add-to-cart-btn", "Sepete Ekle");
          btn.type = "button";
          btn.dataset.id = "admin-" + p.id;
          btn.dataset.name = p.name;
          btn.dataset.price = String(p.price);
        }
        card.appendChild(btn);
        grid.appendChild(card);
      });

      const emptyEl = document.getElementById("empty-products");
      if (emptyEl) emptyEl.hidden = byId.size > 0;

      if (typeof updateCategoryChips === "function") updateCategoryChips();
      if (typeof filterProducts === "function") filterProducts();
    }

    // Karta (ya da "Seçenekleri Gör"e) tıklayınca detay penceresi
    grid.addEventListener("click", (e) => {
      const card = e.target.closest('.product__card[data-admin="1"]');
      if (!card || e.target.closest(".add-to-cart-btn")) return;
      const p = byId.get(card.dataset.productId);
      if (p) openModal(p);
    });

    /* ---------- Detay penceresi ---------- */
    function buildModal() {
      if (modal) return;
      modal = document.createElement("div");
      modal.className = "pm-overlay";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="pm-title">
          <button type="button" class="pm-close" aria-label="Kapat">&times;</button>
          <div class="pm-gallery">
            <div class="pm-main">
              <button type="button" class="pm-nav pm-prev" aria-label="Önceki fotoğraf">&#8249;</button>
              <img id="pm-main-img" alt="" />
              <button type="button" class="pm-nav pm-next" aria-label="Sonraki fotoğraf">&#8250;</button>
            </div>
            <div class="pm-thumbs" id="pm-thumbs"></div>
          </div>
          <div class="pm-info">
            <span class="pm-cat" id="pm-cat"></span>
            <h3 id="pm-title"></h3>
            <p class="pm-price" id="pm-price"></p>
            <p class="pm-desc" id="pm-desc"></p>
            <div class="pm-colors" id="pm-colors-wrap">
              <span class="pm-label">Renk: <b id="pm-color-name"></b></span>
              <div class="pm-swatches" id="pm-swatches"></div>
            </div>
            <button type="button" class="pm-add">Sepete Ekle</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.closest(".pm-close")) closeModal();
      });
      modal
        .querySelector(".pm-prev")
        .addEventListener("click", () => setImg(state.img - 1));
      modal
        .querySelector(".pm-next")
        .addEventListener("click", () => setImg(state.img + 1));
      modal.querySelector(".pm-add").addEventListener("click", addFromModal);

      document.addEventListener("keydown", (e) => {
        if (modal.hidden) return;
        if (e.key === "Escape") closeModal();
        if (e.key === "ArrowRight") setImg(state.img + 1);
        if (e.key === "ArrowLeft") setImg(state.img - 1);
      });
    }

    function setImg(i) {
      const n = state.imgs.length;
      if (!n) return;
      state.img = (i + n) % n;
      const main = modal.querySelector("#pm-main-img");
      main.src = state.imgs[state.img];
      main.alt = `${state.p.name} - fotoğraf ${state.img + 1}`;
      modal.querySelectorAll(".pm-thumb").forEach((t, idx) => {
        t.classList.toggle("active", idx === state.img);
      });
    }

    function selectColor(i) {
      state.color = i;
      const c = state.colors[i];
      modal.querySelector("#pm-color-name").textContent = c ? c.name : "";
      modal.querySelectorAll(".pm-swatch").forEach((s, idx) => {
        s.classList.toggle("active", idx === i);
        s.setAttribute("aria-pressed", String(idx === i));
      });
      if (
        c &&
        Number.isInteger(c.image) &&
        c.image >= 0 &&
        c.image < state.imgs.length
      ) {
        setImg(c.image);
      }
    }

    function openModal(p) {
      buildModal();
      lastFocus = document.activeElement;

      state.p = p;
      state.imgs = imagesOf(p);
      state.colors = colorsOf(p);
      state.img = 0;
      state.color = null;

      modal.querySelector("#pm-cat").textContent = p.category || "";
      modal.querySelector("#pm-title").textContent = p.name;
      modal.querySelector("#pm-price").textContent = fmtTL(Number(p.price));
      modal.querySelector("#pm-desc").textContent = p.description || "";

      const thumbs = modal.querySelector("#pm-thumbs");
      thumbs.replaceChildren();
      state.imgs.forEach((src, i) => {
        const b = el("button", "pm-thumb");
        b.type = "button";
        b.setAttribute("aria-label", `Fotoğraf ${i + 1}`);
        const im = document.createElement("img");
        im.src = src;
        im.alt = "";
        b.appendChild(im);
        b.addEventListener("click", () => setImg(i));
        thumbs.appendChild(b);
      });
      const multi = state.imgs.length > 1;
      thumbs.hidden = !multi;
      modal.querySelector(".pm-prev").hidden = !multi;
      modal.querySelector(".pm-next").hidden = !multi;

      const wrap = modal.querySelector("#pm-colors-wrap");
      const sw = modal.querySelector("#pm-swatches");
      sw.replaceChildren();
      wrap.hidden = state.colors.length === 0;
      state.colors.forEach((c, i) => {
        const s = el("button", "pm-swatch");
        s.type = "button";
        s.style.background = hexOf(c.hex);
        s.title = c.name;
        s.setAttribute("aria-label", c.name);
        s.addEventListener("click", () => selectColor(i));
        sw.appendChild(s);
      });

      const addBtn = modal.querySelector(".pm-add");
      addBtn.textContent = "Sepete Ekle";
      addBtn.disabled = false;

      setImg(0);
      if (state.colors.length) selectColor(0);

      modal.hidden = false;
      document.body.style.overflow = "hidden";
      modal.querySelector(".pm-close").focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function addFromModal() {
      const p = state.p;
      if (!p) return;
      const color = state.color !== null ? state.colors[state.color] : null;
      addToCart({
        id: "admin-" + p.id + (color ? "-" + color.name : ""),
        name: p.name + (color ? ` (${color.name})` : ""),
        price: Number(p.price),
      });
      const btn = modal.querySelector(".pm-add");
      btn.textContent = "Sepete eklendi ✓";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = "Sepete Ekle";
        btn.disabled = false;
      }, 900);
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

// ---------- Ayarlardan (config.js) WhatsApp ve Instagram bağlantıları ----------
(function () {
  const c = window.SITE_CONFIG;
  if (!c) return;
  document.querySelectorAll("[data-whatsapp]").forEach((a) => {
    const withMsg = a.dataset.whatsapp === "msg";
    a.href =
      `https://wa.me/${c.whatsapp}` +
      (withMsg ? `?text=${encodeURIComponent(c.greeting || "")}` : "");
  });
  document.querySelectorAll("[data-instagram]").forEach((a) => {
    a.href = `https://instagram.com/${c.instagram}`;
  });
})();
