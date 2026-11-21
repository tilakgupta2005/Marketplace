from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from app.services.cart_service import build_cart_summary

def create_order(customer_id: str, carts_collection, products_collection, orders_collection):
    summary = build_cart_summary(customer_id, carts_collection, products_collection)
    if not summary["items"]:
        raise HTTPException(status_code=400, detail="Cannot place an empty order")

    decremented = []
    try:
        for item in summary["items"]:
            result = products_collection.update_one(
                {
                    "_id": ObjectId(item["product_id"]),
                    "stock": {"$gte": item["quantity"]},
                },
                {"$inc": {"stock": -item["quantity"]}},
            )
            if result.modified_count != 1:
                raise ValueError(f"Insufficient stock for {item['product_name']}")
            decremented.append(item)
    except Exception as exc:
        for item in decremented:
            products_collection.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": item["quantity"]}},
            )
        raise HTTPException(status_code=409, detail=str(exc))

    order = {
        **summary,
        "status": "placed",
        "created_at": datetime.now(timezone.utc),
    }
    result = orders_collection.insert_one(order)
    carts_collection.update_one(
        {"customer_id": customer_id}, {"$set": {"items": []}}
    )
    order["id"] = str(result.inserted_id)
    order.pop("_id", None)
    return order

def get_order(orders_collection, order_id: str):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    order = orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["id"] = str(order.pop("_id"))
    return order
