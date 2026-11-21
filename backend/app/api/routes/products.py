from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_products_collection
from app.schemas.product_schema import ProductResponse
from app.services.product_service import list_products, get_product

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=list[ProductResponse])
def get_all_products(
    category: Optional[str] = Query(default=None),
    products_collection=Depends(get_products_collection),
):
    return list_products(products_collection, category)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(
    product_id: str,
    products_collection=Depends(get_products_collection),
):
    return get_product(products_collection, product_id)
