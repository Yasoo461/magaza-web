// Adım 2: Kargo seçimi -> localStorage("shippingCost") -> odeme.html
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

  // Adres girilmeden bu sayfaya gelinmişse geri gönder
  if (!localStorage.getItem("checkoutAddress")) {
    window.location.href = "adres.html";
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

  const radios = document.querySelectorAll('input[name="shipping"]');
  let shippingCost = 30;

  // Daha önce seçilmişse işaretle
  const savedCost = localStorage.getItem("shippingCost");
  if (savedCost !== null) {
    radios.forEach((r) => {
      if (Number(r.value) === Number(savedCost)) r.checked = true;
    });
  }

  function updateTotals() {
    const checked = document.querySelector('input[name="shipping"]:checked');
    shippingCost = checked ? Number(checked.value) : 30;
    document.getElementById("subtotal-price").textContent = fmt(subtotal);
    document.getElementById("shipping-price").textContent =
      shippingCost === 0 ? "Ücretsiz" : fmt(shippingCost);
    document.getElementById("final-total-price").textContent = fmt(
      subtotal + shippingCost,
    );
  }

  radios.forEach((r) => r.addEventListener("change", updateTotals));
  updateTotals();

  document.getElementById("shipping-form").addEventListener("submit", (e) => {
    e.preventDefault();
    localStorage.setItem("shippingCost", String(shippingCost));
    window.location.href = "odeme.html";
  });
});
