const STORAGE_KEY = "furniProducts";
const MAX_IMAGES = 5;
const MAX_ORIGINAL_SIZE = 8 * 1024 * 1024; // seçilen dosya en fazla 8 MB (sıkıştırılarak kaydedilir)

const form = document.getElementById("product-form");
const nameInput = document.getElementById("product-name");
const priceInput = document.getElementById("product-price");
const categoryInput = document.getElementById("product-category");
const descriptionInput = document.getElementById("product-description");
const imagesInput = document.getElementById("product-images");
const imagePreviews = document.getElementById("image-previews");
const colorNameInput = document.getElementById("color-name");
const colorHexInput = document.getElementById("color-hex");
const colorImageSelect = document.getElementById("color-image");
const addColorButton = document.getElementById("add-color");
const colorList = document.getElementById("color-list");
const productList = document.getElementById("product-list");
const productCount = document.getElementById("product-count");
const status = document.getElementById("status");
const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-edit");

let products = loadProducts();
let editingId = null;
let images = []; // data URL listesi, ilk fotoğraf kapak
let colors = []; // { name, hex, image: fotoğraf sırası | null }

/* ---------- Depolama ---------- */
function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch {
    status.textContent =
      "Kayıt başarısız. Tarayıcı depolama alanı dolmuş olabilir. Daha az fotoğraf seç ya da eski ürünleri sil.";
    return false;
  }
}

/* ---------- Yardımcılar ---------- */
function formatPrice(price) {
  return Number(price).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function productImages(product) {
  if (Array.isArray(product.images) && product.images.length)
    return product.images;
  return product.image ? [product.image] : [];
}

function validHex(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#cccccc";
}

/* ---------- Fotoğraf işleme (küçült + sıkıştır) ---------- */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

async function compressImage(file) {
  const img = await loadImage(await fileToDataUrl(file));
  const MAX_SIDE = 900;
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  let out = canvas.toDataURL("image/webp", 0.85);
  if (!out.startsWith("data:image/webp")) {
    // WebP desteklenmiyorsa beyaz zeminli JPEG
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    out = canvas.toDataURL("image/jpeg", 0.85);
  }
  return out;
}

imagesInput.addEventListener("change", async () => {
  const files = [...imagesInput.files];
  imagesInput.value = "";
  if (!files.length) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  let added = 0;
  let skipped = "";

  for (const file of files) {
    if (images.length >= MAX_IMAGES) {
      skipped = `En fazla ${MAX_IMAGES} fotoğraf eklenebilir.`;
      break;
    }
    if (!allowed.includes(file.type)) {
      skipped = "Sadece JPG, PNG veya WebP formatı kabul edilir.";
      continue;
    }
    if (file.size > MAX_ORIGINAL_SIZE) {
      skipped = "Bir fotoğraf 8 MB'dan büyük olduğu için eklenmedi.";
      continue;
    }
    try {
      status.textContent = "Fotoğraflar hazırlanıyor...";
      images.push(await compressImage(file));
      added++;
    } catch {
      skipped = "Bir fotoğraf okunamadı.";
    }
  }

  renderImagePreviews();
  refreshColorImageSelect();
  renderColors();
  status.textContent = skipped || (added ? "" : "");
});

function renderImagePreviews() {
  imagePreviews.replaceChildren();

  images.forEach((src, i) => {
    const item = makeElement("div", "thumb");

    const img = makeElement("img");
    img.src = src;
    img.alt = `Fotoğraf ${i + 1}`;
    item.append(img);

    if (i === 0) item.append(makeElement("span", "thumb-badge", "Kapak"));

    const remove = makeElement("button", "thumb-remove", "×");
    remove.type = "button";
    remove.title = "Fotoğrafı sil";
    remove.addEventListener("click", () => removeImage(i));
    item.append(remove);

    if (i > 0) {
      const cover = makeElement("button", "thumb-cover", "Kapak yap");
      cover.type = "button";
      cover.addEventListener("click", () => makeCover(i));
      item.append(cover);
    }

    imagePreviews.append(item);
  });
}

function removeImage(index) {
  images.splice(index, 1);
  colors.forEach((color) => {
    if (color.image === index) color.image = null;
    else if (color.image !== null && color.image > index) color.image -= 1;
  });
  renderImagePreviews();
  refreshColorImageSelect();
  renderColors();
}

function makeCover(index) {
  const order = [index, ...images.map((_, i) => i).filter((i) => i !== index)];
  const map = {};
  order.forEach((oldIndex, newIndex) => (map[oldIndex] = newIndex));
  images = order.map((i) => images[i]);
  colors.forEach((color) => {
    if (color.image !== null) color.image = map[color.image];
  });
  renderImagePreviews();
  refreshColorImageSelect();
  renderColors();
}

/* ---------- Renkler ---------- */
function refreshColorImageSelect() {
  colorImageSelect.replaceChildren();
  const none = makeElement("option", "", "Fotoğraf: yok");
  none.value = "";
  colorImageSelect.append(none);
  images.forEach((_, i) => {
    const option = makeElement("option", "", `Fotoğraf ${i + 1}`);
    option.value = String(i);
    colorImageSelect.append(option);
  });
}

function renderColors() {
  colorList.replaceChildren();

  colors.forEach((color, i) => {
    const chip = makeElement("div", "color-chip");

    const swatch = makeElement("span", "color-swatch");
    swatch.style.background = validHex(color.hex);

    const label = makeElement(
      "span",
      "",
      color.image !== null
        ? `${color.name} (Fotoğraf ${color.image + 1})`
        : color.name,
    );

    const remove = makeElement("button", "chip-remove", "×");
    remove.type = "button";
    remove.title = "Rengi sil";
    remove.addEventListener("click", () => {
      colors.splice(i, 1);
      renderColors();
    });

    chip.append(swatch, label, remove);
    colorList.append(chip);
  });
}

addColorButton.addEventListener("click", () => {
  const name = colorNameInput.value.trim();
  if (!name) {
    status.textContent = "Lütfen renk adını yaz.";
    colorNameInput.focus();
    return;
  }
  if (
    colors.some(
      (c) =>
        c.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"),
    )
  ) {
    status.textContent = "Bu renk zaten eklenmiş.";
    return;
  }
  if (colors.length >= 12) {
    status.textContent = "En fazla 12 renk eklenebilir.";
    return;
  }

  const imageValue = colorImageSelect.value;
  colors.push({
    name,
    hex: validHex(colorHexInput.value),
    image: imageValue === "" ? null : Number(imageValue),
  });

  colorNameInput.value = "";
  colorImageSelect.value = "";
  status.textContent = "";
  renderColors();
});

colorNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // formu göndermesin
    addColorButton.click();
  }
});

/* ---------- Ürün listesi ---------- */
function renderProducts() {
  productList.replaceChildren();
  productCount.textContent = `${products.length} ürün`;

  if (products.length === 0) {
    productList.append(
      makeElement("p", "empty-message", "Henüz ürün eklenmedi."),
    );
    return;
  }

  products.forEach((product) => {
    const card = makeElement("article", "admin-product");
    const productImgs = productImages(product);

    const image = makeElement("img");
    image.src = productImgs[0] || "";
    image.alt = product.name;

    const details = makeElement("div");
    details.append(makeElement("h3", "", product.name));
    details.append(makeElement("p", "", formatPrice(product.price)));
    details.append(makeElement("p", "", `Kategori: ${product.category}`));

    const meta = [`${productImgs.length} fotoğraf`];
    if (Array.isArray(product.colors) && product.colors.length) {
      meta.push(`Renkler: ${product.colors.map((c) => c.name).join(", ")}`);
    }
    details.append(makeElement("p", "", meta.join(" · ")));
    details.append(
      makeElement("p", "", product.description || "Açıklama girilmedi."),
    );

    const actions = makeElement("div", "product-actions");

    const editButton = makeElement("button", "edit-button", "Düzenle");
    editButton.type = "button";
    editButton.addEventListener("click", () => editProduct(product.id));

    const deleteButton = makeElement("button", "delete-button", "Sil");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteProduct(product.id));

    actions.append(editButton, deleteButton);
    card.append(image, details, actions);
    productList.append(card);
  });
}

/* ---------- Kaydet / Düzenle / Sil ---------- */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const category = categoryInput.value;
  const description = descriptionInput.value.trim();

  if (!name || !category || !Number.isFinite(price) || price <= 0) {
    status.textContent = "Lütfen ürün adı, geçerli fiyat ve kategori gir.";
    return;
  }

  if (images.length === 0) {
    status.textContent = "Lütfen en az bir ürün fotoğrafı ekle.";
    return;
  }

  const product = {
    id:
      editingId ||
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    price,
    category,
    description,
    image: images[0], // eski sürümlerle uyumluluk için kapak fotoğrafı
    images: [...images],
    colors: colors.map((c) => ({ name: c.name, hex: c.hex, image: c.image })),
  };

  const previousProducts = products;

  products = editingId
    ? products.map((item) => (item.id === editingId ? product : item))
    : [...products, product];

  if (!saveProducts()) {
    products = previousProducts;
    return;
  }

  renderProducts();
  resetForm();
  status.textContent = "Ürün başarıyla kaydedildi.";
});

function editProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  editingId = id;
  nameInput.value = product.name;
  priceInput.value = product.price;
  categoryInput.value = product.category;
  descriptionInput.value = product.description || "";

  images = [...productImages(product)];
  colors = (Array.isArray(product.colors) ? product.colors : []).map((c) => ({
    name: c.name,
    hex: validHex(c.hex),
    image:
      Number.isInteger(c.image) && c.image < images.length ? c.image : null,
  }));

  renderImagePreviews();
  refreshColorImageSelect();
  renderColors();

  formTitle.textContent = "Ürünü Düzenle";
  saveButton.textContent = "Değişiklikleri Kaydet";
  cancelButton.hidden = false;
  status.textContent = "";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  if (!confirm(`"${product.name}" ürününü silmek istiyor musun?`)) return;

  const previousProducts = products;
  products = products.filter((item) => item.id !== id);

  if (!saveProducts()) {
    products = previousProducts;
    return;
  }

  if (editingId === id) resetForm();

  renderProducts();
  status.textContent = "Ürün silindi.";
}

function resetForm() {
  form.reset();
  editingId = null;
  images = [];
  colors = [];
  renderImagePreviews();
  refreshColorImageSelect();
  renderColors();
  formTitle.textContent = "Yeni Ürün Ekle";
  saveButton.textContent = "Ürünü Kaydet";
  cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
  resetForm();
  status.textContent = "Düzenleme iptal edildi.";
});

refreshColorImageSelect();
renderProducts();
