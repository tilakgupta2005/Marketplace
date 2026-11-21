from bson import ObjectId
from app.database import get_database
from app.dependencies import get_products_collection

SAMPLE_PRODUCTS = [
    {
        "_id": ObjectId("665000000000000000000001"),
        "name": "Wheat Seeds",
        "category": "Seeds",
        "price": 500,
        "stock": 10,
        "image": "/static/images/wheat-seeds.jpg",
        "description": "Quality wheat seeds for farming.",
    },
    {
        "_id": ObjectId("665000000000000000000002"),
        "name": "Urea Fertilizer",
        "category": "Fertilizers",
        "price": 300,
        "stock": 5,
        "image": "/static/images/urea-fertilizer.jpg",
        "description": "Agricultural urea fertilizer.",
    },
    {
        "_id": ObjectId("665000000000000000000003"),
        "name": "Mustard Seeds",
        "category": "Seeds",
        "price": 700,
        "stock": 0,
        "image": "/static/images/mustard-seeds.jpg",
        "description": "Mustard seeds. Currently out of stock.",
    },
]

if __name__ == "__main__":
    db = get_database()
    products = get_products_collection()
    products.delete_many({})
    products.insert_many(SAMPLE_PRODUCTS)
    db.carts.delete_many({})
    print(f"Inserted {len(SAMPLE_PRODUCTS)} sample products.")
