from fastapi import APIRouter, Depends
from app.dependencies import get_carts_collection, get_products_collection, get_orders_collection
from app.schemas.order_schema import OrderCreate, OrderResponse
from app.services.order_service import create_order, get_order

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=OrderResponse, status_code=201)
def place_order(
    payload: OrderCreate,
    carts_collection=Depends(get_carts_collection),
    products_collection=Depends(get_products_collection),
    orders_collection=Depends(get_orders_collection),
):
    return create_order(
        payload.customer_id, carts_collection, products_collection, orders_collection
    )

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: str,
    orders_collection=Depends(get_orders_collection),
):
    return get_order(orders_collection, order_id)
