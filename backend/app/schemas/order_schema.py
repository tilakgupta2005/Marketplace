from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.cart_schema import CartLineResponse


class OrderCreate(BaseModel):
    """Request body for placing the current customer's cart as an order."""

    customer_id: str = Field(
        min_length=1,
        max_length=100,
        description="Customer ID used in the cart endpoints.",
        examples=["customer_001"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"customer_id": "customer_001"}
            ]
        }
    }


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    items: list[CartLineResponse]
    subtotal: float
    gst_rate: float
    gst_amount: float
    total: float
    status: str
    created_at: datetime
