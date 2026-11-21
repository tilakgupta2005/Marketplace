(() => {
  "use strict";

  const config = window.AGROLINK_CONFIG || {};
  const API_BASE = (config.API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
  const CUSTOMER_STORAGE_KEY = "agrolink_customer_id";
  const $ = (selector) => document.querySelector(selector);

  const state = {
    products: [],
    cart: { items: [], subtotal: 0, gst_rate: 0.18, gst_amount: 0, total: 0 },
    category: "all",
    search: "",
    customerId: localStorage.getItem(CUSTOMER_STORAGE_KEY) || config.DEFAULT_CUSTOMER_ID || "customer_001",
    busy: false
  };

  const els = {
    productGrid: $("#productGrid"),
    categoryTabs: $("#categoryTabs"),
    searchInput: $("#searchInput"),
    resultCount: $("#resultCount"),
    apiStatus: $("#apiStatus"),
    cartDrawer: $("#cartDrawer"),
    drawerBackdrop: $("#drawerBackdrop"),
    cartItems: $("#cartItems"),
    cartCount: $("#cartCount"),
    drawerItemCount: $("#drawerItemCount"),
    cartSubtotal: $("#cartSubtotal"),
    cartGst: $("#cartGst"),
    cartTotal: $("#cartTotal"),
    checkoutBtn: $("#checkoutBtn"),
    clearCartBtn: $("#clearCartBtn"),
    customerLabel: $("#customerLabel"),
    customerDialog: $("#customerDialog"),
    customerIdInput: $("#customerIdInput"),
    toastRegion: $("#toastRegion")
  };

  const money = (amount) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2
  }).format(Number(amount || 0));

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);

  const placeholderImage = (name = "Farm product") =>
    `https://placehold.co/640x440/e9efdf/49633d?text=${encodeURIComponent(name)}`;

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) {
      const detail = data && typeof data === "object" ? data.detail : null;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg || "Invalid input").join(", ")
        : (detail || `Request failed (${response.status})`);
      throw new Error(message);
    }
    return data;
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.textContent = message;
    els.toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function setApiStatus(message, isError = false) {
    els.apiStatus.textContent = message;
    els.apiStatus.classList.toggle("error", isError);
    els.apiStatus.classList.remove("hidden");
  }

  function clearApiStatus() {
    els.apiStatus.classList.add("hidden");
  }

  function productImage(product) {
    const image = product.image || "";
    if (!image) return placeholderImage(product.name);
    // Backend sample image paths are rooted at /static; resolve them against the API host.
    if (image.startsWith("/")) return `${API_BASE.replace(/\/api$/, "")}${image}`;
    return image;
  }

  function renderCategories() {
    const categories = [...new Set(state.products.map((p) => p.category).filter(Boolean))].sort();
    const all = ["all", ...categories];
    els.categoryTabs.innerHTML = all.map((category) => {
      const label = category === "all" ? "All products" : category;
      return `<button class="category-tab ${state.category === category ? "active" : ""}"
        data-category="${escapeHtml(category)}">${escapeHtml(label)}</button>`;
    }).join("");
  }

  function getVisibleProducts() {
    return state.products.filter((product) => {
      const categoryMatch = state.category === "all" || product.category === state.category;
      const query = state.search.trim().toLowerCase();
      const searchMatch = !query ||
        `${product.name} ${product.category} ${product.description || ""}`.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }

  function renderProducts() {
    const products = getVisibleProducts();
    els.resultCount.textContent = `${products.length} product${products.length === 1 ? "" : "s"} found`;

    if (!products.length) {
      els.productGrid.innerHTML = `<div class="empty-state"><strong>No products found</strong><span>Try another category or search term.</span></div>`;
      return;
    }

    els.productGrid.innerHTML = products.map((product) => {
      const outOfStock = Number(product.stock) <= 0;
      const image = escapeHtml(productImage(product));
      const name = escapeHtml(product.name);
      const description = escapeHtml(product.description || "A farm essential, ready when you need it.");
      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <img class="product-image" src="${image}" alt="${name}" loading="lazy"
              onerror="this.onerror=null;this.src='${placeholderImage("Agrolink product")}';">
            <span class="stock-pill ${outOfStock ? "out" : ""}">${outOfStock ? "OUT OF STOCK" : `${Number(product.stock)} AVAILABLE`}</span>
          </div>
          <div class="product-info">
            <span class="product-category">${escapeHtml(product.category || "Agriculture")}</span>
            <h3>${name}</h3>
            <p class="product-description">${description}</p>
            <div class="product-bottom">
              <div class="product-price"><strong>${money(product.price)}</strong><small>per unit</small></div>
              <button class="add-button" data-add="${escapeHtml(product.id)}" ${outOfStock ? "disabled" : ""}>
                ${outOfStock ? "Unavailable" : "＋ Add to cart"}
              </button>
            </div>
            <div class="stock-text">${outOfStock ? "Currently unavailable" : "Stock is checked at checkout"}</div>
          </div>
        </article>`;
    }).join("");
  }

  function cartItemCount() {
    return (state.cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  function renderCart() {
    const items = state.cart.items || [];
    const count = cartItemCount();
    els.cartCount.textContent = count;
    els.drawerItemCount.textContent = `(${count})`;
    els.customerLabel.textContent = state.customerId;
    els.cartSubtotal.textContent = money(state.cart.subtotal);
    els.cartGst.textContent = money(state.cart.gst_amount);
    els.cartTotal.textContent = money(state.cart.total);
    els.checkoutBtn.disabled = items.length === 0 || state.busy;
    els.clearCartBtn.disabled = items.length === 0 || state.busy;

    if (!items.length) {
      els.cartItems.innerHTML = `<div class="empty-cart"><div class="empty-cart-icon">🧺</div><h3>Your cart is waiting</h3><p>Add a few essentials to get started.</p><button class="text-button" id="continueShoppingBtn">Explore products ↗</button></div>`;
      return;
    }

    els.cartItems.innerHTML = items.map((item) => {
      const product = state.products.find((p) => p.id === item.product_id);
      const image = product ? productImage(product) : placeholderImage(item.product_name);
      const maxStock = product ? Number(product.stock) : Number(item.quantity);
      return `
        <div class="cart-line">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(item.product_name)}"
            onerror="this.onerror=null;this.src='${placeholderImage("Product")}';">
          <div class="cart-line-main">
            <strong>${escapeHtml(item.product_name)}</strong>
            <small>${money(item.price)} / unit</small>
            <div class="cart-line-actions">
              <button class="qty-button" data-qty="-1" data-product="${escapeHtml(item.product_id)}" aria-label="Decrease quantity">−</button>
              <span class="qty-value">${Number(item.quantity)}</span>
              <button class="qty-button" data-qty="1" data-product="${escapeHtml(item.product_id)}"
                aria-label="Increase quantity" ${Number(item.quantity) >= maxStock ? "disabled" : ""}>＋</button>
              <button class="remove-button" data-remove="${escapeHtml(item.product_id)}">Remove</button>
            </div>
          </div>
          <strong class="cart-line-total">${money(item.line_total)}</strong>
        </div>`;
    }).join("");
  }

  async function loadProducts() {
    els.productGrid.innerHTML = `<div class="loading-card"><span class="loader"></span><p>Gathering your farm essentials...</p></div>`;
    try {
      const result = await apiRequest("/products/");
      state.products = Array.isArray(result) ? result : (result.products || []);
      renderCategories();
      renderProducts();
      clearApiStatus();
    } catch (error) {
      els.productGrid.innerHTML = `<div class="empty-state"><strong>We couldn't load the products</strong><span>Check that the FastAPI backend is running, then retry.</span></div>`;
      setApiStatus(`Backend connection failed: ${error.message}. Confirm API_BASE_URL in js/config.js and start FastAPI.`, true);
      els.resultCount.textContent = "Products unavailable";
    }
  }

  async function loadCart() {
    try {
      state.cart = await apiRequest(`/cart/${encodeURIComponent(state.customerId)}`);
      renderCart();
    } catch (error) {
      setApiStatus(`Cart could not be loaded: ${error.message}`, true);
      showToast(error.message, "error");
    }
  }

  async function addToCart(productId) {
    const existing = (state.cart.items || []).find((item) => item.product_id === productId);
    const product = state.products.find((item) => item.id === productId);
    if (!product || Number(product.stock) <= 0) return;
    try {
      state.cart = await apiRequest(`/cart/${encodeURIComponent(state.customerId)}/items`, {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      renderCart();
      showToast(`${product.name} added to your cart`);
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function changeQuantity(productId, delta) {
    const item = (state.cart.items || []).find((entry) => entry.product_id === productId);
    if (!item) return;
    const nextQuantity = Number(item.quantity) + delta;
    if (nextQuantity < 1) {
      await removeFromCart(productId);
      return;
    }
    try {
      state.cart = await apiRequest(`/cart/${encodeURIComponent(state.customerId)}/items/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: nextQuantity })
      });
      renderCart();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function removeFromCart(productId) {
    try {
      state.cart = await apiRequest(`/cart/${encodeURIComponent(state.customerId)}/items/${encodeURIComponent(productId)}`, {
        method: "DELETE"
      });
      renderCart();
      showToast("Product removed from cart");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function clearCart() {
    try {
      await apiRequest(`/cart/${encodeURIComponent(state.customerId)}`, { method: "DELETE" });
      await loadCart();
      showToast("Your cart has been cleared");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function placeOrder() {
    if (!state.cart.items || !state.cart.items.length || state.busy) return;
    const confirmed = window.confirm(`Place this order for ${money(state.cart.total)}?`);
    if (!confirmed) return;
    state.busy = true;
    renderCart();
    els.checkoutBtn.textContent = "Placing order...";
    try {
      const order = await apiRequest("/orders/", {
        method: "POST",
        body: JSON.stringify({ customer_id: state.customerId })
      });
      await loadProducts();
      await loadCart();
      closeCart();
      showToast(`Order placed successfully · ${order.id}`);
    } catch (error) {
      showToast(error.message, "error");
      await loadProducts();
      await loadCart();
    } finally {
      state.busy = false;
      els.checkoutBtn.innerHTML = 'Place order <span>→</span>';
      renderCart();
    }
  }

  function openCart() {
    els.cartDrawer.classList.add("open");
    els.drawerBackdrop.classList.add("open");
    els.cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    els.cartDrawer.classList.remove("open");
    els.drawerBackdrop.classList.remove("open");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openCustomerDialog() {
    els.customerIdInput.value = state.customerId;
    els.customerDialog.showModal();
  }

  async function saveCustomer(event) {
    event.preventDefault();
    const nextId = els.customerIdInput.value.trim();
    if (!nextId) return;
    const changed = nextId !== state.customerId;
    state.customerId = nextId;
    localStorage.setItem(CUSTOMER_STORAGE_KEY, nextId);
    els.customerDialog.close();
    renderCart();
    if (changed) {
      await loadCart();
      showToast(`Switched to ${nextId}`);
    }
  }

  function bindEvents() {
    els.categoryTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      renderCategories();
      renderProducts();
    });

    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderProducts();
    });

    els.productGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add]");
      if (button && !button.disabled) addToCart(button.dataset.add);
    });

    els.cartItems.addEventListener("click", (event) => {
      const qtyButton = event.target.closest("[data-qty]");
      const removeButton = event.target.closest("[data-remove]");
      const continueButton = event.target.closest("#continueShoppingBtn");
      if (qtyButton && !qtyButton.disabled) {
        changeQuantity(qtyButton.dataset.product, Number(qtyButton.dataset.qty));
      } else if (removeButton) {
        removeFromCart(removeButton.dataset.remove);
      } else if (continueButton) {
        closeCart();
        document.querySelector("#marketplace").scrollIntoView({ behavior: "smooth" });
      }
    });

    $("#openCartBtn").addEventListener("click", openCart);
    $("#closeCartBtn").addEventListener("click", closeCart);
    els.drawerBackdrop.addEventListener("click", closeCart);
    $("#changeCustomerBtn").addEventListener("click", openCustomerDialog);
    $("#customerForm").addEventListener("submit", saveCustomer);
    $("#customerForm").addEventListener("click", (event) => {
      if (event.target.value === "cancel") els.customerDialog.close();
    });
    els.checkoutBtn.addEventListener("click", placeOrder);
    els.clearCartBtn.addEventListener("click", clearCart);
    $("#continueShoppingBtn")?.addEventListener("click", () => {
      closeCart();
      document.querySelector("#marketplace").scrollIntoView({ behavior: "smooth" });
    });
    $("#mobileMenuBtn").addEventListener("click", () => {
      document.querySelector("#marketplace").scrollIntoView({ behavior: "smooth" });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCart();
    });
  }

  async function init() {
    $("#year").textContent = new Date().getFullYear();
    bindEvents();
    renderCart();
    await loadProducts();
    await loadCart();
  }

  init();
})();
