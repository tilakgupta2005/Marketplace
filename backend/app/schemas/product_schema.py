from pydantic import BaseModel, Field, field_validator


class ProductCreate(BaseModel):
    """Fields accepted when creating a product."""

    name: str = Field(
        min_length=2, max_length=120,
        description="Product name.",
        examples=["Wheat Seeds"],
    )
    category: str = Field(
        min_length=2, max_length=60,
        description="Product category, such as Seeds or Fertilizers.",
        examples=["Seeds"],
    )
    price: float = Field(
        gt=0,
        description="Unit price in Indian rupees.",
        examples=[500],
    )
    stock: int = Field(
        ge=0,
        description="Available quantity. Use 0 for out of stock.",
        examples=[10],
    )
    image: str = Field(
        default="",
        description="Product image path or URL.",
        examples=["/static/images/wheat-seeds.jpg"],
    )
    description: str = Field(
        default="",
        description="Short product description.",
        examples=["Quality wheat seeds for farming."],
    )

    @field_validator("name", "category")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    stock: int
    image: str = ""
    description: str = ""
