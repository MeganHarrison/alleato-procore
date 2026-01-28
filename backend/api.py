"""
Compatibility module for tests expecting `from api import app, get_ingestion_pipeline, get_rag_store`.
It re-exports these from `src.api.main` where the FastAPI app actually lives.
"""
from src.api.main import app, get_ingestion_pipeline, get_rag_store  # noqa: F401

