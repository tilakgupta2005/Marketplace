from bson import ObjectId
from fastapi import HTTPException

def parse_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    return ObjectId(value)

def serialize_product(product: dict) -> dict:
    return {
        "id": str(product["_id"]),
        "name": product["name"],
        "category": product["category"],
        "price": float(product["price"]),
        "stock": int(product["stock"]),
        "image": product.get("image", ""),
        "description": product.get("description", ""),
    }
