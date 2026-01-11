// KEY FOR LOCAL STORAGE
const CART_KEY = "beansCart";

// ---------- CART HELPERS ----------

function loadCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  // update all cart-count elements (header + floating)
  document.querySelectorAll(".cart-count").forEach(span => {
    span.textContent = count;
  });

  // show / hide floating cart
  const floating = document.getElementById("floatingCart");
  if (floating) {
    floating.style.display = count > 0 ? "block" : "none";
  }
}

function addItemToCart(name, price, image) {
  const cart = loadCart();
  const existing = cart.find(i => i.name === name);

  if (existing) {
    existing.quantity += 1;
    // keep image if it was missing before
    if (!existing.image && image) existing.image = image;
  } else {
    cart.push({ name, price, quantity: 1, image: image || "" });
  }

  saveCart(cart);
  updateCartCount();

  // bump animation on floating cart
  const floatLink = document.querySelector(".floating-cart-link");
  if (floatLink) {
    floatLink.classList.remove("bump");
    void floatLink.offsetWidth;
    floatLink.classList.add("bump");
  }
}


// ---------- CART PAGE RENDER (+ / -) ----------

function renderCartPage() {
  const container = document.querySelector(".cart-items");
  if (!container) return; // not on cart page

  const cart = loadCart();
  const emptyMsg = document.querySelector(".cart-empty");
  const totalSpan = document.getElementById("cart-total");

  container.innerHTML = "";

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    if (totalSpan) totalSpan.textContent = "0.00";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  let total = 0;

  cart.forEach(item => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.dataset.name = item.name;

    const safeImg = item.image && item.image.trim() ? item.image : "Image/2586-logo-1713637013.642color-003932.svg";

    div.innerHTML = `
  <img class="cart-item-img" src="${safeImg}" alt="${item.name}">
  <span class="cart-item-name">${item.name}</span>
  <div class="cart-qty">
    <button class="qty-btn minus" type="button">−</button>
    <span class="qty-value">${item.quantity}</span>
    <button class="qty-btn plus" type="button">+</button>
  </div>
  <span class="cart-item-line">฿${lineTotal.toFixed(2)}</span>
`;

    container.appendChild(div);
  });

  if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

// handle clicks on + / - in the cart
function setupCartQuantityControls() {
  const container = document.querySelector(".cart-items");
  if (!container) return; // not on cart page

  container.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn) return;

    const isPlus = btn.classList.contains("plus");
    const isMinus = btn.classList.contains("minus");
    if (!isPlus && !isMinus) return;

    const itemRow = btn.closest(".cart-item");
    if (!itemRow) return;

    const name = itemRow.dataset.name;
    if (!name) return;

    const cart = loadCart();
    const item = cart.find(i => i.name === name);
    if (!item) return;

    if (isPlus) {
      item.quantity += 1;
    } else if (isMinus) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        const idx = cart.indexOf(item);
        if (idx !== -1) cart.splice(idx, 1);
      }
    }

    saveCart(cart);
    updateCartCount();
    renderCartPage(); // re-render with new quantities
  });
}

// ---------- REVEAL ON SCROLL ----------

function setupReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealEls.forEach(el => el.classList.add("show"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => observer.observe(el));
}

// ---------- FIRST-TIME VISITOR DISCOUNT MODAL ----------

function setupDiscountModal() {
  const modal = document.getElementById("discountModal");
  if (!modal) return; // not on home page

  const closeBtn = document.getElementById("discountModalClose");
  const form = document.getElementById("discountForm");
  const SEEN_KEY = "beansDiscountModalSeen";

  const hasSeen = localStorage.getItem(SEEN_KEY) === "yes";

  // show modal only if user hasn't seen it before
  if (!hasSeen) {
    setTimeout(() => {
      modal.classList.add("show");
    }, 800); // tiny delay so it feels smooth
  }

  function closeModal() {
    modal.classList.remove("show");
    localStorage.setItem(SEEN_KEY, "yes");
  }

  // close on X button
  closeBtn.addEventListener("click", closeModal);

  // close when clicking outside the box
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // handle form submit (front-end only)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    closeModal();
    alert("Thank you! Your 10% discount is ready at the counter.");
  });
}

// ---------- SETUP EVENTS ON LOAD ----------

document.addEventListener("DOMContentLoaded", () => {
  // Add-to-cart buttons (on product pages)
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price || "0");

      // get the image from the same card
      const card = btn.closest(".card");
      const img = card ? card.querySelector("img") : null;
      const image = img ? img.getAttribute("src") : "";

      addItemToCart(name, price, image);
    });
  });

  updateCartCount();
  renderCartPage();
  setupCartQuantityControls();
  setupReveal();
  setupDiscountModal();
});

// ---------- SEARCH FILTER + ANIMATED TEXT ----------
function filterProducts() {
  const input = document.getElementById("product-search");
  if (!input) return;

  const query = input.value.trim().toLowerCase();

  // Filter cards on the page (Coffee/Brewing)
  document.querySelectorAll(".card").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(query) ? "" : "none";
  });

  // Animated helper text (simple + effective)
  const anim = document.getElementById("search-animation-text");
  if (anim) {
    if (!query) {
      anim.textContent = "Try searching: latte, espresso, cold brew, V60…";
    } else {
      anim.textContent = `Showing results for: "${query}"`;
    }
  }
}


