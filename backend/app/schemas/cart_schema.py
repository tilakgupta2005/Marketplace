from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    """Request body for adding a product to the cart."""

    product_id: str = Field(
        min_length=1,
        description="Product ID returned by GET /api/products/.",
        examples=["665000000000000000000001"],
    )
    quantity: int = Field(
        gt=0, le=1000,
        description="Number of units to add. Must be greater than zero.",
        examples=[2],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "product_id": "665000000000000000000001",
                    "quantity": 2
                }
            ]
        }
    }


class CartItemUpdate(BaseModel):
    """Request body for setting a cart item's quantity."""

    quantity: int = Field(
        ge=1, le=1000,
        description="New total quantity. Minimum is 1 and it cannot exceed stock.",
        examples=[3],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"quantity": 3}
            ]
        }
    }


class CartLineResponse(BaseModel):
    product_id: str
    product_name: str
    category: str
    price: float
    quantity: int
    line_total: float


class CartSummaryResponse(BaseModel):
    customer_id: str
    items: list[CartLineResponse]
    subtotal: float
    gst_rate: float
    gst_amount: float
    total: float
