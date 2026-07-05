"""
RAG (Retrieval-Augmented Generation) Service

Uses Gemini text-embedding-004 to embed data chunks from uploaded files,
stores them in an in-memory numpy vector store, and retrieves the most
relevant chunks for a given query.

No external vector DB required — pure numpy cosine similarity.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

# ─── In-memory store: file_path → {chunks, embeddings, metadata} ───────────
_vector_store: Dict[str, Dict] = {}


def _get_gemini_embedding(text: str) -> Optional[np.ndarray]:
    """Get embedding from Gemini text-embedding-004 model."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("No GOOGLE_API_KEY — falling back to TF-IDF embeddings")
            return None
        genai.configure(api_key=api_key)
        result = genai.embed_content(
            model="models/gemini-embedding-2",
            content=text,
            task_type="retrieval_document"
        )
        return np.array(result["embedding"], dtype=np.float32)
    except Exception as e:
        logger.error(f"Gemini embedding error: {e}")
        return None


def _fallback_embedding(text: str, dim: int = 256) -> np.ndarray:
    """
    Simple bag-of-words hash embedding as fallback when Gemini API is unavailable.
    Deterministic and fast.
    """
    vec = np.zeros(dim, dtype=np.float32)
    for word in text.lower().split():
        h = hash(word) % dim
        vec[h] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec


def _embed(text: str) -> np.ndarray:
    """Embed text, with Gemini primary and hash-bow fallback."""
    emb = _get_gemini_embedding(text)
    if emb is None:
        emb = _fallback_embedding(text)
    return emb


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _chunk_dataframe(df: pd.DataFrame, chunk_size: int = 20) -> List[str]:
    """
    Convert a DataFrame into text chunks for embedding.
    Produces:
    - Schema chunk (column names + dtypes)
    - Stats chunk (describe() output)
    - Row chunks (every chunk_size rows as CSV text)
    """
    chunks = []

    # Chunk 1: Schema description
    schema_lines = ["Dataset Schema:"]
    for col in df.columns:
        dtype = str(df[col].dtype)
        nunique = df[col].nunique()
        sample = str(df[col].dropna().head(3).tolist())
        schema_lines.append(f"  {col} ({dtype}): {nunique} unique values, e.g. {sample}")
    chunks.append("\n".join(schema_lines))

    # Chunk 2: Statistical summary
    try:
        desc = df.describe(include="all").to_string()
        chunks.append(f"Statistical Summary:\n{desc}")
    except Exception:
        pass

    # Chunk 3: Row data chunks
    for i in range(0, min(len(df), 500), chunk_size):
        subset = df.iloc[i : i + chunk_size]
        text = f"Rows {i}–{i + len(subset) - 1}:\n{subset.to_csv(index=False)}"
        chunks.append(text)

    # Chunk 4: Column value distributions for categoricals
    for col in df.select_dtypes(include=["object", "category"]).columns[:5]:
        top = df[col].value_counts().head(10).to_dict()
        chunks.append(f"Top values for '{col}': {json.dumps(top)}")

    return chunks


def index_file(file_path: str, df: pd.DataFrame) -> int:
    """
    Index a DataFrame into the in-memory vector store.
    
    Args:
        file_path: Unique key (path to the uploaded file)
        df: Loaded DataFrame
    
    Returns:
        Number of chunks indexed
    """
    global _vector_store

    # Skip re-indexing if already indexed
    if file_path in _vector_store:
        logger.info(f"RAG: '{file_path}' already indexed ({len(_vector_store[file_path]['chunks'])} chunks)")
        return len(_vector_store[file_path]["chunks"])

    logger.info(f"RAG: Indexing '{file_path}'...")
    chunks = _chunk_dataframe(df)
    
    embeddings = []
    for i, chunk in enumerate(chunks):
        emb = _embed(chunk)
        embeddings.append(emb)
        if i % 10 == 0:
            logger.info(f"RAG: Embedded {i}/{len(chunks)} chunks")

    _vector_store[file_path] = {
        "chunks": chunks,
        "embeddings": np.array(embeddings, dtype=np.float32),
        "indexed_at": datetime.utcnow().isoformat(),
        "shape": df.shape,
    }

    logger.info(f"RAG: Indexed {len(chunks)} chunks for '{file_path}'")
    return len(chunks)


def retrieve(
    query: str,
    file_path: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Retrieve top-k most relevant chunks for a query from indexed file.
    
    Args:
        query: User's natural language question
        file_path: Key into the vector store
        top_k: Number of chunks to return
    
    Returns:
        List of dicts: [{text, score, chunk_index}]
    """
    if file_path not in _vector_store:
        logger.warning(f"RAG: '{file_path}' not indexed. Returning empty.")
        return []

    store = _vector_store[file_path]
    query_emb = _embed(query)

    scores = []
    for i, chunk_emb in enumerate(store["embeddings"]):
        score = _cosine_similarity(query_emb, chunk_emb)
        scores.append((i, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    top = scores[:top_k]

    return [
        {
            "text": store["chunks"][idx],
            "score": round(score, 4),
            "chunk_index": idx,
        }
        for idx, score in top
        if score > 0.01
    ]


def build_context(
    query: str,
    file_path: str,
    top_k: int = 5,
    max_chars: int = 4000
) -> str:
    """
    Build a context string for RAG-augmented generation.
    
    Returns a trimmed, formatted context string ready to inject into a prompt.
    """
    passages = retrieve(query, file_path, top_k=top_k)
    if not passages:
        return "No data context available."

    parts = [f"[Context from uploaded data — top {len(passages)} relevant passages]\n"]
    total = 0
    for p in passages:
        chunk = p["text"]
        if total + len(chunk) > max_chars:
            remaining = max_chars - total
            chunk = chunk[:remaining] + "..."
        parts.append(chunk)
        total += len(chunk)
        if total >= max_chars:
            break

    return "\n\n---\n\n".join(parts)


def is_indexed(file_path: str) -> bool:
    """Check if a file is already in the vector store."""
    return file_path in _vector_store


def get_store_info() -> Dict[str, Any]:
    """Return metadata about currently indexed files."""
    return {
        key: {
            "chunks": len(val["chunks"]),
            "indexed_at": val["indexed_at"],
            "shape": val["shape"],
        }
        for key, val in _vector_store.items()
    }
