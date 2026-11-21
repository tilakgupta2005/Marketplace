from fastapi import HTTPException
from app.utils import parse_object_id, serialize_product

def list_products(products_collection, category: str | None = None):
    query = {}
    if category and category.lower() != "all":
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    products = products_collection.find(query).sort("name", 1)
    return [serialize_product(product) for product in products]

def get_product(products_collection, product_id: str):
    product = products_collection.find_one({"_id": parse_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)


def create_product(products_collection, payload):
    """Insert a validated product and return the public product representation."""
    product = payload.model_dump()
    result = products_collection.insert_one(product)
    product["_id"] = result.inserted_id
    return serialize_product(product)


def update_product(products_collection, product_id: str, payload):
    """Replace an existing product's editable fields."""
    product_oid = parse_object_id(product_id)
    update = payload.model_dump()
    result = products_collection.update_one({"_id": product_oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return get_product(products_collection, product_id)


def delete_product(products_collection, product_id: str):
    """Delete a product from the catalogue."""
    product_oid = parse_object_id(product_id)
    result = products_collection.delete_one({"_id": product_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully", "id": product_id}
