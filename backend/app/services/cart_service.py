from fastapi import HTTPException
from app.config import GST_RATE
from app.utils import parse_object_id

def get_cart_document(carts_collection, customer_id: str):
    return carts_collection.find_one({"customer_id": customer_id}) or {
        "customer_id": customer_id,
        "items": [],
    }

def build_cart_summary(customer_id: str, carts_collection, products_collection):
    cart = get_cart_document(carts_collection, customer_id)
    items = []
    subtotal = 0.0

    for cart_item in cart["items"]:
        product = products_collection.find_one({"_id": cart_item["product_id"]})
        if not product:
            continue
        quantity = int(cart_item["quantity"])
        price = float(product["price"])
        line_total = round(price * quantity, 2)
        items.append({
            "product_id": str(product["_id"]),
            "product_name": product["name"],
            "category": product["category"],
            "price": price,
            "quantity": quantity,
            "line_total": line_total,
        })
        subtotal += line_total

    subtotal = round(subtotal, 2)
    gst_amount = round(subtotal * GST_RATE, 2)
    return {
        "customer_id": customer_id,
        "items": items,
        "subtotal": subtotal,
        "gst_rate": GST_RATE,
        "gst_amount": gst_amount,
        "total": round(subtotal + gst_amount, 2),
    }

def add_item_to_cart(customer_id: str, payload, carts_collection, products_collection):
    product_id = parse_object_id(payload.product_id)
    product = products_collection.find_one({"_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["stock"] <= 0:
        raise HTTPException(status_code=400, detail="Product is out of stock")

    cart = get_cart_document(carts_collection, customer_id)
    existing = next((item for item in cart["items"] if item["product_id"] == product_id), None)
    new_quantity = payload.quantity + (existing["quantity"] if existing else 0)
    if new_quantity > product["stock"]:
        raise HTTPException(status_code=400, detail=f"Only {product['stock']} units are available")

    if existing:
        existing["quantity"] = new_quantity
    else:
        cart["items"].append({"product_id": product_id, "quantity": payload.quantity})

    carts_collection.update_one(
        {"customer_id": customer_id},
        {"$set": {"items": cart["items"]}},
        upsert=True,
    )
    return build_cart_summary(customer_id, carts_collection, products_collection)

def update_cart_item(customer_id: str, product_id: str, quantity: int, carts_collection, products_collection):
    product_oid = parse_object_id(product_id)
    product = products_collection.find_one({"_id": product_oid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if quantity > product["stock"]:
        raise HTTPException(status_code=400, detail=f"Only {product['stock']} units are available")

    cart = get_cart_document(carts_collection, customer_id)
    item = next((item for item in cart["items"] if item["product_id"] == product_oid), None)
    if not item:
        raise HTTPException(status_code=404, detail="Product is not in this cart")
    item["quantity"] = quantity
    carts_collection.update_one(
        {"customer_id": customer_id}, {"$set": {"items": cart["items"]}}
    )
    return build_cart_summary(customer_id, carts_collection, products_collection)

def remove_cart_item(customer_id: str, product_id: str, carts_collection, products_collection):
    product_oid = parse_object_id(product_id)
    cart = get_cart_document(carts_collection, customer_id)
    updated_items = [item for item in cart["items"] if item["product_id"] != product_oid]
    if len(updated_items) == len(cart["items"]):
        raise HTTPException(status_code=404, detail="Product is not in this cart")
    carts_collection.update_one(
        {"customer_id": customer_id}, {"$set": {"items": updated_items}}
    )
    return build_cart_summary(customer_id, carts_collection, products_collection)

def clear_cart(customer_id: str, carts_collection):
    carts_collection.update_one(
        {"customer_id": customer_id}, {"$set": {"items": []}}, upsert=True
    )
    return {"message": "Cart cleared"}
