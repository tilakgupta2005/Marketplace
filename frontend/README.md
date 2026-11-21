# Bharat Agrolink Frontend

Responsive HTML, CSS and vanilla JavaScript storefront connected to the Bharat Agrolink V3 FastAPI backend.

## Features

- Product listing from `GET /api/products/`
- Category filters and client-side search
- Out-of-stock handling
- Add-to-cart with backend stock validation
- Quantity increase/decrease and remove item
- Cart subtotal, simplified 18% GST, and final total from backend
- Place order through `POST /api/orders/`
- Customer ID selection saved in browser local storage
- Responsive shopping cart drawer and mobile-friendly layout

## 1. Start the backend

Start MongoDB, seed the sample data if you have not already, then run the V3 backend:

```bash
python -m scripts.seed_db
uvicorn app.main:app --reload
```

The backend should be available at `http://127.0.0.1:8000`.

## 2. Configure the API URL

Open `js/config.js`:

```js
window.AGROLINK_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000/api",
  DEFAULT_CUSTOMER_ID: "customer_001"
};
```

Change `API_BASE_URL` if your backend runs on a different host or port.

## 3. Run the frontend

From this frontend folder, run:

```bash
python -m http.server 5500
```

Open `http://127.0.0.1:5500`.

Do not open `index.html` directly as a `file://` URL; use the local HTTP server.

## 4. Backend endpoints used

| Feature | Method | Endpoint |
|---|---|---|
| Load products | GET | `/api/products/` |
| Filter products | GET | `/api/products/?category=Seeds` (frontend filters locally after loading) |
| Load cart | GET | `/api/cart/{customer_id}` |
| Add product | POST | `/api/cart/{customer_id}/items` |
| Change quantity | PATCH | `/api/cart/{customer_id}/items/{product_id}` |
| Remove product | DELETE | `/api/cart/{customer_id}/items/{product_id}` |
| Clear cart | DELETE | `/api/cart/{customer_id}` |
| Place order | POST | `/api/orders/` |

## Notes

- Cart totals are read from the backend. JavaScript does not independently calculate the authoritative order total.
- The customer ID is a demo identifier, not authentication. Do not use this approach for a production customer account system.
- Product images use the image path returned by the API. If the image is empty or unavailable, a placeholder is shown.
- The hero uses an externally hosted Unsplash image. Product images can be set in the sample MongoDB product records.
- The backend's CORS middleware currently allows all origins for local assessment development. Restrict it before deployment.
- GST is displayed using the backend's simplified 18% assessment rule.


## Admin panel

Open `http://127.0.0.1:5500/admin.html` after starting the same static frontend server. The admin panel lets you:

- Create products using `POST /api/admin/products`.
- Read the full product catalogue using `GET /api/admin/products`.
- Edit products using `PUT /api/admin/products/{product_id}`. The form loads the selected product and saves all editable fields.
- Delete products using `DELETE /api/admin/products/{product_id}` after a confirmation prompt.
- View the current product catalogue and stock.
- View all orders using `GET /api/admin/orders`, newest first, including customer ID, items, quantities, subtotal, GST, total, and created date.
- See summary counts for products, orders, and the sum of order totals.

There is no login by request. This is for local/demo use only. Anyone who can reach the admin page and API can add products and read orders. Add authentication and role-based authorization before public deployment.
