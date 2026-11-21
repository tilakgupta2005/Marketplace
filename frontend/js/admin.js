(() => {
  "use strict";
  const config = window.AGROLINK_CONFIG || {};
  const API_BASE = (config.API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
  const $ = (selector) => document.querySelector(selector);
  const money = (value) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value || 0));
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));
  let editingProductId = null;

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {}) }});
    const raw = await response.text(); let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) { const detail = data && data.detail; throw new Error(Array.isArray(detail) ? detail.map(x => x.msg).join(", ") : (detail || `Request failed (${response.status})`)); }
    return data;
  }
  function toast(message, error = false) { const node = document.createElement("div"); node.className = `toast${error ? " error" : ""}`; node.textContent = message; $("#toastRegion").appendChild(node); setTimeout(() => node.remove(), 3200); }
  function dateLabel(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN", {dateStyle:"medium",timeStyle:"short"}); }

  async function loadProducts() {
    const products = await api("/admin/products");
    $("#statProducts").textContent = products.length;
    $("#productRows").innerHTML = products.length ? products.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td>${money(p.price)}</td><td><span class="stock ${Number(p.stock) <= 0 ? "out" : ""}">${Number(p.stock) <= 0 ? "Out of stock" : Number(p.stock)}</span></td><td><div class="row-actions"><button class="table-action edit" type="button" data-edit="${escapeHtml(p.id)}">Edit</button><button class="table-action delete" type="button" data-delete="${escapeHtml(p.id)}">Delete</button></div></td></tr>`).join("") : `<tr><td colspan="5" class="empty">No products yet. Add your first product.</td></tr>`;
  }
  async function loadOrders() {
    const orders = await api("/admin/orders");
    $("#statOrders").textContent = orders.length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    $("#statRevenue").textContent = money(revenue);
    $("#ordersList").innerHTML = orders.length ? orders.map(order => {
      const items = (order.items || []).map(item => `<li>${escapeHtml(item.product_name)} · ${Number(item.quantity)} × ${money(item.price)} = ${money(item.line_total)}</li>`).join("");
      return `<article class="order-card"><div><div class="order-top"><span class="order-id">Order #${escapeHtml(String(order.id).slice(-8).toUpperCase())}</span><span class="status">${escapeHtml(order.status || "placed")}</span></div><div class="order-meta">Customer: ${escapeHtml(order.customer_id)} · ${dateLabel(order.created_at)}</div><ul class="order-items">${items}</ul><div class="order-meta">Subtotal ${money(order.subtotal)} · GST ${money(order.gst_amount)}</div></div><div class="order-total">${money(order.total)}<small>ORDER TOTAL</small></div></article>`;
    }).join("") : `<div class="empty-block">No orders have been placed yet.</div>`;
  }
  async function refreshAll() {
    $("#productRows").innerHTML = `<tr><td colspan="5" class="empty">Loading products…</td></tr>`;
    $("#ordersList").innerHTML = `<div class="empty-block">Loading orders…</div>`;
    try { await Promise.all([loadProducts(), loadOrders()]); }
    catch (error) { toast(`Could not load admin data: ${error.message}`, true); }
  }
  function resetProductForm() {
    editingProductId = null;
    $("#productForm").reset();
    $("#formHeading").innerHTML = 'Add a <em>product.</em>';
    $("#saveProduct").textContent = "＋ Add product";
    $("#cancelEdit").hidden = true;
    $("#formMessage").textContent = "";
    $("#formMessage").classList.remove("error");
  }
  async function startEdit(productId) {
    try {
      const products = await api("/admin/products");
      const product = products.find(item => item.id === productId);
      if (!product) throw new Error("Product not found. Refresh the catalogue.");
      editingProductId = product.id;
      const form = $("#productForm");
      for (const field of ["name", "category", "price", "stock", "image", "description"]) form.elements[field].value = product[field] ?? "";
      $("#formHeading").innerHTML = 'Edit <em>product.</em>';
      $("#saveProduct").textContent = "Save changes";
      $("#cancelEdit").hidden = false;
      $("#formMessage").textContent = `Editing ${product.name}`;
      $("#formMessage").classList.remove("error");
      form.scrollIntoView({behavior:"smooth", block:"center"});
      form.elements.name.focus({preventScroll:true});
    } catch (error) { toast(error.message, true); }
  }

  $("#productForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget; const button = $("#saveProduct"); const message = $("#formMessage");
    const data = new FormData(form);
    const payload = { name: String(data.get("name") || "").trim(), category: String(data.get("category") || "").trim(), price: Number(data.get("price")), stock: Number(data.get("stock")), image: String(data.get("image") || "").trim(), description: String(data.get("description") || "").trim() };
    const wasEditing = Boolean(editingProductId); const path = wasEditing ? `/admin/products/${encodeURIComponent(editingProductId)}` : "/admin/products";
    button.disabled = true; button.textContent = wasEditing ? "Saving changes…" : "Adding product…"; message.textContent = ""; message.classList.remove("error");
    try {
      const product = await api(path, {method:wasEditing ? "PUT" : "POST", body:JSON.stringify(payload)});
      resetProductForm(); message.textContent = wasEditing ? `${product.name} was updated successfully.` : `${product.name} was added successfully.`;
      toast(wasEditing ? "Product updated." : "Product added to marketplace."); await loadProducts();
    } catch (error) { message.textContent = error.message; message.classList.add("error"); toast(error.message, true); }
    finally { button.disabled = false; button.textContent = editingProductId ? "Save changes" : "＋ Add product"; }
  });

  $("#productRows").addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    if (editButton) { await startEdit(editButton.dataset.edit); return; }
    if (deleteButton) {
      const productId = deleteButton.dataset.delete;
      const row = deleteButton.closest("tr");
      const productName = row?.querySelector("td")?.textContent || "this product";
      if (!window.confirm(`Delete ${productName} from the catalogue? This cannot be undone.`)) return;
      deleteButton.disabled = true;
      try {
        await api(`/admin/products/${encodeURIComponent(productId)}`, {method:"DELETE"});
        if (editingProductId === productId) resetProductForm();
        toast("Product deleted."); await loadProducts();
      } catch (error) { toast(error.message, true); deleteButton.disabled = false; }
    }
  });

  $("#cancelEdit").addEventListener("click", resetProductForm);
  $("#refreshAll").addEventListener("click", refreshAll);
  refreshAll();
})();
