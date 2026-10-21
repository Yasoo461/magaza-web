// Adım 1: Adres bilgileri -> localStorage("checkoutAddress") -> kargo.html
const fmt = (n) =>
  n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " TL";

document.addEventListener("DOMContentLoaded", () => {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("userCart")) || [];
  } catch (e) {
    cart = [];
  }

  if (cart.length === 0) {
    alert("Sepetiniz boş! Ana sayfaya yönlendiriliyorsunuz.");
    window.location.href = "index.html";
    return;
  }

  // Sipariş özeti
  const list = document.getElementById("checkout-cart-items");
  let subtotal = 0;
  list.replaceChildren();
  cart.forEach((item) => {
    const total = Number(item.price) * Number(item.quantity);
    subtotal += total;
    const row = document.createElement("div");
    row.className = "summary-item";
    const name = document.createElement("span");
    name.textContent = `${item.name} (x${item.quantity})`;
    const price = document.createElement("strong");
    price.textContent = fmt(total);
    row.append(name, price);
    list.appendChild(row);
  });
  document.getElementById("subtotal-price").textContent = fmt(subtotal);

  // Daha önce girilmişse formu doldur (geri gelindiğinde)
  try {
    const saved = JSON.parse(localStorage.getItem("checkoutAddress")) || {};
    ["fullname", "phone", "email", "address"].forEach((id) => {
      if (saved[id]) document.getElementById(id).value = saved[id];
    });
  } catch (e) {}

  const form = document.getElementById("address-form");
  const errorEl = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      fullname: document.getElementById("fullname").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      address: document.getElementById("address").value.trim(),
    };

    if (!data.fullname || !data.phone || !data.email || !data.address) {
      errorEl.textContent = "Lütfen tüm alanları eksiksiz doldurun.";
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errorEl.textContent = "Lütfen geçerli bir e-posta adresi girin.";
      return;
    }
    if (data.phone.replace(/\D/g, "").length < 10) {
      errorEl.textContent = "Lütfen geçerli bir telefon numarası girin.";
      return;
    }

    localStorage.setItem("checkoutAddress", JSON.stringify(data));
    window.location.href = "kargo.html";
  });
});
