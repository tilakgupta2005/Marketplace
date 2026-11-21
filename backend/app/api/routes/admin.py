from fastapi import APIRouter, Depends

from app.dependencies import get_orders_collection, get_products_collection
from app.schemas.order_schema import OrderResponse
from app.schemas.product_schema import ProductCreate, ProductResponse
from app.services.product_service import create_product, list_products, update_product, delete_product

router = APIRouter(prefix="/admin", tags=["admin - no authentication"])


@router.get("/products", response_model=list[ProductResponse])
def admin_list_products(products_collection=Depends(get_products_collection)):
    """Return all products for the admin catalogue."""
    return list_products(products_collection)


@router.post("/products", response_model=ProductResponse, status_code=201)
def admin_create_product(
    payload: ProductCreate,
    products_collection=Depends(get_products_collection),
):
    """Add a new marketplace product. This demo endpoint has no authentication."""
    return create_product(products_collection, payload)


@router.get("/orders", response_model=list[OrderResponse])
def admin_list_orders(orders_collection=Depends(get_orders_collection)):
    """Return all orders, newest first. This demo endpoint has no authentication."""
    orders = []
    for order in orders_collection.find({}).sort("created_at", -1):
        order["id"] = str(order.pop("_id"))
        orders.append(order)
    return orders


@router.put("/products/{product_id}", response_model=ProductResponse)
def admin_update_product(
    product_id: str,
    payload: ProductCreate,
    products_collection=Depends(get_products_collection),
):
    """Replace an existing product with the submitted product details."""
    return update_product(products_collection, product_id, payload)


@router.delete("/products/{product_id}")
def admin_delete_product(
    product_id: str,
    products_collection=Depends(get_products_collection),
):
    """Delete a product from the marketplace catalogue."""
    return delete_product(products_collection, product_id)
