let currentStep = 1;
const completedSteps = { 1: false, 2: false };

document.addEventListener("DOMContentLoaded", () => {
  const cart = JSON.parse(localStorage.getItem("userCart")) || [];

  const summaryItemsContainer = document.getElementById("checkout-cart-items");
  const subtotalPriceEl = document.getElementById("subtotal-price");
  const shippingPriceEl = document.getElementById("shipping-price");
  const finalTotalPriceEl = document.getElementById("final-total-price");
  const shippingRadios = document.querySelectorAll('input[name="shipping"]');
  const checkoutForm = document.getElementById("checkout-form");

  let subtotal = 0;
  let shippingCost = 30;

  // 1. Sepet Boşsa Yönlendir
  if (cart.length === 0) {
    alert("Sepetiniz boş! Ana sayfaya yönlendiriliyorsunuz.");
    window.location.href = "index.html";
    return;
  }

  // 2. Sepet Özeti Listeleme
  summaryItemsContainer.innerHTML = "";
  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("summary-item");
    itemDiv.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <strong>${itemTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</strong>
    `;
    summaryItemsContainer.appendChild(itemDiv);
  });

  function updateTotals() {
    subtotalPriceEl.textContent = `${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
    shippingPriceEl.textContent = `${shippingCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;

    const finalTotal = subtotal + shippingCost;
    finalTotalPriceEl.textContent = `${finalTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
  }

  shippingRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      shippingCost = parseFloat(e.target.value);
      updateTotals();
    });
  });

  updateTotals();

  // 3. Siparişi Tamamlama
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;

    alert(
      `Tebrikler ${fullname}! Siparişiniz başarıyla alındı.\nSipariş onayınız ${email} adresine gönderildi.`,
    );

    localStorage.removeItem("userCart");
    window.location.href = "index.html";
  });
});

// Adım Değiştirme Fonksiyonu
function goToStep(stepNumber) {
  // Geri gitmeye izin ver, ama ileri gitmek için önceki adım tamamlanmış olmalı
  if (stepNumber > currentStep) {
    if (stepNumber === 2 && !validateStep(1)) return;
    if (stepNumber === 3 && (!validateStep(1) || !validateStep(2))) return;
  }

  document
    .querySelectorAll(".form-step-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".step")
    .forEach((el) => el.classList.remove("active"));

  document.getElementById(`step-content-${stepNumber}`).classList.add("active");
  document.getElementById(`step-tab-${stepNumber}`).classList.add("active");

  currentStep = stepNumber;
}

// İleri Butonuna Basıldığında
function nextStep(stepNumber) {
  if (validateStep(stepNumber)) {
    completedSteps[stepNumber] = true;
    document
      .getElementById(`step-tab-${stepNumber}`)
      .classList.add("completed");
    goToStep(stepNumber + 1);
  }
}

// Form Alanlarını Doğrulama
function validateStep(stepNumber) {
  if (stepNumber === 1) {
    const fullname = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!fullname || !phone || !email || !address) {
      alert("Lütfen teslimat ve iletişim alanlarını eksiksiz doldurun.");
      return false;
    }
  }
  return true;
}
