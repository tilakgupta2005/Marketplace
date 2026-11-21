from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from fastapi.middleware.cors import CORSMiddleware
from app.database import close_mongo_connection, get_database
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    close_mongo_connection()

app = FastAPI(
    title="Bharat Agrolink API",
    description="Mini agriculture marketplace backend",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your frontend origin before deployment.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.exception_handler(PyMongoError)
def mongo_error_handler(request: Request, exc: PyMongoError):
    # Keep the API response actionable without exposing connection credentials.
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "MongoDB is not reachable. Start the MongoDB service or update "
                "MONGODB_URI in your .env file, then retry."
            ),
            "database_status": "unavailable",
        },
    )

@app.get("/")
def root():
    return {"message": "Bharat Agrolink API is running", "docs": "/docs"}

@app.get("/health")
def health():
    """Check both API and MongoDB connectivity."""
    try:
        get_database().command("ping")
        return {"status": "ok", "database": "connected"}
    except PyMongoError:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "database": "unavailable",
                "hint": "Start MongoDB or configure MONGODB_URI in .env.",
            },
        )
