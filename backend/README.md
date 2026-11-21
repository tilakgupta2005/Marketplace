# Bharat Agrolink Backend

FastAPI + Pydantic v2 + MongoDB backend for the Mini Agriculture Marketplace.

## Architecture

The routing pattern follows a modular `APIRouter` structure:

- `app/main.py` creates the FastAPI application and includes the central API router.
- `app/api/router.py` combines feature routers.
- `app/api/routes/` contains endpoint definitions only.
- `app/schemas/` contains Pydantic request and response models.
- `app/services/` contains business logic.
- `app/dependencies.py` provides MongoDB collections through FastAPI `Depends()`.
- `app/database.py` manages the MongoDB client.

There is no authentication dependency in this assessment version.

## Features

- Product listing and category filtering
- Pydantic request and response validation
- Cart add, update, remove, and clear
- Stock validation on cart changes and order placement
- Subtotal, simplified 18% GST, and final total
- Order creation and retrieval
- No-login admin product CRUD (create, read, update, delete) and order listing

## Setup

Requirements: Python 3.10+ and a running MongoDB server (local MongoDB Community Server or MongoDB Atlas).

**Important Windows note:** `mongodb://localhost:27017` requires the MongoDB database server to be installed and running on your computer. Installing MongoDB Compass alone is not enough. If MongoDB is installed as a Windows service, open PowerShell as Administrator and run:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

If the service name is not found, start MongoDB from the Windows Services app (`services.msc`) if it is installed, or use a MongoDB Atlas connection string in `.env`. Example local `.env`:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=bharat_agrolink
```

Example Atlas `.env` (replace with your actual connection string):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
DATABASE_NAME=bharat_agrolink
```

Do not commit `.env` or share credentials. Test connectivity at `http://127.0.0.1:8000/health`; it should return `{"status":"ok","database":"connected"}`. If MongoDB is unavailable, product/cart/admin API requests now return HTTP 503 with a clear message instead of an unhandled 500 traceback.

```bash
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and configure `MONGODB_URI`.

Seed sample data (this resets the products and carts collections in the configured database):

```bash
python -m scripts.seed_db
```

Run:

```bash
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for Swagger UI.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products/` | List products |
| GET | `/api/products/?category=Seeds` | Filter products |
| GET | `/api/products/{product_id}` | Product details |
| GET | `/api/cart/{customer_id}` | Cart summary |
| POST | `/api/cart/{customer_id}/items` | Add item |
| PATCH | `/api/cart/{customer_id}/items/{product_id}` | Update quantity |
| DELETE | `/api/cart/{customer_id}/items/{product_id}` | Remove item |
| DELETE | `/api/cart/{customer_id}` | Clear cart |
| POST | `/api/orders/` | Place order |
| GET | `/api/orders/{order_id}` | Get order |
| GET | `/api/admin/products` | Admin: list all products |
| POST | `/api/admin/products` | Admin: create a product |
| PUT | `/api/admin/products/{product_id}` | Admin: replace/update a product |
| DELETE | `/api/admin/products/{product_id}` | Admin: delete a product |
| GET | `/api/admin/orders` | Admin: list all orders, newest first |

## Expected calculation

Wheat Seeds × 2 and Urea Fertilizer × 1:

- Subtotal: ₹1,300
- GST (18%): ₹234
- Total: ₹1,534

GST is fixed at 18% only to match the simplified assessment example. Actual GST treatment depends on product classification and applicable tax rules.

## Notes

- A `customer_id` identifies the cart; login/authentication is not included.
- Product IDs are MongoDB ObjectIds.
- Stock is conditionally decremented to prevent negative inventory. For production-grade multi-item order guarantees, use MongoDB transactions on a replica set and idempotency keys.
- Configure CORS to your actual frontend origin before deployment.


## Admin panel (demo / assessment only)

The separate admin page is included in the frontend ZIP at `admin.html`. It uses these endpoints:

- `GET /api/admin/products` to list products.
- `POST /api/admin/products` to create a product.
- `PUT /api/admin/products/{product_id}` to update all editable product fields.
- `DELETE /api/admin/products/{product_id}` to remove a product.
- `GET /api/admin/orders` to list all orders newest first.

The admin catalogue displays Edit and Delete actions. Edit loads the selected product into the form; Save changes sends a PUT request. Delete asks for confirmation before sending DELETE.

There is deliberately no authentication because this is the requested assessment version. Anyone who can reach the API can add products and read customer orders. Do not deploy this publicly until authentication, authorization, rate limiting, and audit logging are added.
