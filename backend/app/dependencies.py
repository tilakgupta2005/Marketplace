from app.database import get_database

def get_products_collection():
    return get_database()["products"]

def get_carts_collection():
    return get_database()["carts"]

def get_orders_collection():
    return get_database()["orders"]
