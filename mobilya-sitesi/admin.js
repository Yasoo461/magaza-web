const STORAGE_KEY = "furniProducts";

const form = document.getElementById("product-form");
const nameInput = document.getElementById("product-name");
const priceInput = document.getElementById("product-price");
const categoryInput = document.getElementById("product-category");
const descriptionInput = document.getElementById("product-description");
const imageInput = document.getElementById("product-image");
const imagePreview = document.getElementById("image-preview");
const productList = document.getElementById("product-list");
const productCount = document.getElementById("product-count");
const status = document.getElementById("status");
const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-edit");

let products = loadProducts();
let editingId = null;
let selectedImage = "";

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
      "Kayıt başarısız. Görsel boyutu veya tarayıcı depolama alanı sınırına ulaşılmış olabilir.";
    return false;
  }
}

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

    const image = makeElement("img");
    image.src = product.image;
    image.alt = product.name;

    const details = makeElement("div");
    details.append(makeElement("h3", "", product.name));
    details.append(makeElement("p", "", formatPrice(product.price)));
    details.append(makeElement("p", "", `Kategori: ${product.category}`));
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

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    status.textContent = "JPG, PNG veya WebP formatında bir görsel seç.";
    imageInput.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    status.textContent = "Görsel en fazla 2 MB olabilir.";
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedImage = reader.result;
    imagePreview.src = selectedImage;
    imagePreview.hidden = false;
    status.textContent = "";
  };

  reader.onerror = () => {
    status.textContent = "Görsel okunamadı. Tekrar dene.";
  };

  reader.readAsDataURL(file);
});

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

  const existing = products.find((product) => product.id === editingId);
  const image = selectedImage || existing?.image;

  if (!image) {
    status.textContent = "Lütfen ürün fotoğrafı seç.";
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
    image,
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

  selectedImage = product.image;
  imagePreview.src = product.image;
  imagePreview.hidden = false;

  formTitle.textContent = "Ürünü Düzenle";
  saveButton.textContent = "Değişiklikleri Kaydet";
  cancelButton.hidden = false;
  status.textContent = "";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  if (!confirm(`"${product.name}" ürününü silmek istiyor musun?`)) {
    return;
  }

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
  selectedImage = "";
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  formTitle.textContent = "Yeni Ürün Ekle";
  saveButton.textContent = "Ürünü Kaydet";
  cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
  resetForm();
  status.textContent = "Düzenleme iptal edildi.";
});

renderProducts();
