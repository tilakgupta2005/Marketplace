from fastapi import APIRouter, Depends
from app.dependencies import get_carts_collection, get_products_collection
from app.schemas.cart_schema import CartItemCreate, CartItemUpdate, CartSummaryResponse
from app.services.cart_service import (
    build_cart_summary, add_item_to_cart, update_cart_item,
    remove_cart_item, clear_cart,
)

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("/{customer_id}", response_model=CartSummaryResponse)
def get_customer_cart(
    customer_id: str,
    carts_collection=Depends(get_carts_collection),
    products_collection=Depends(get_products_collection),
):
    return build_cart_summary(customer_id, carts_collection, products_collection)

@router.post("/{customer_id}/items", response_model=CartSummaryResponse)
def add_product_to_cart(
    customer_id: str,
    payload: CartItemCreate,
    carts_collection=Depends(get_carts_collection),
    products_collection=Depends(get_products_collection),
):
    return add_item_to_cart(customer_id, payload, carts_collection, products_collection)

@router.patch("/{customer_id}/items/{product_id}", response_model=CartSummaryResponse)
def change_cart_quantity(
    customer_id: str,
    product_id: str,
    payload: CartItemUpdate,
    carts_collection=Depends(get_carts_collection),
    products_collection=Depends(get_products_collection),
):
    return update_cart_item(
        customer_id, product_id, payload.quantity, carts_collection, products_collection
    )

@router.delete("/{customer_id}/items/{product_id}", response_model=CartSummaryResponse)
def delete_cart_product(
    customer_id: str,
    product_id: str,
    carts_collection=Depends(get_carts_collection),
    products_collection=Depends(get_products_collection),
):
    return remove_cart_item(customer_id, product_id, carts_collection, products_collection)

@router.delete("/{customer_id}")
def delete_customer_cart(
    customer_id: str,
    carts_collection=Depends(get_carts_collection),
):
    return clear_cart(customer_id, carts_collection)
