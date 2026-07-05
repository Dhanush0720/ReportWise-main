"""
NexusAnalytics FastAPI Backend

REST API for data analysis with:
- POST /analyze: Main analysis endpoint (orchestrates multi-agent swarm)
- WebSocket /stream-logs: Real-time agent thought streaming
- POST /upload: File upload endpoint
- GET /health: Health check
"""

from dotenv import load_dotenv
# Load environment variables first
load_dotenv()

from fastapi import FastAPI, UploadFile, File, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import json
import os
import logging
from pathlib import Path
from datetime import datetime
import pandas as pd

# Import our modules
from gemini_direct import orchestrate_with_gemini_direct, generate_etl_pipeline, call_gemini
from sandbox import create_sandbox
from data_processor import get_processor
from export_handler import get_export_handler
from chart_validator import ensure_valid_chart_data
from report_generator import get_report_generator
from deck_generator import get_deck_generator
from rag_service import index_file, build_context, is_indexed, get_store_info

# Configure logging
log_level = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, log_level.upper())
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ReportWise API",
    description="Autonomous Multi-Agent Report & Data Workforce",
    version="0.1.0",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Content-Type"],
)

# WebSocket connections tracker
active_connections: List[WebSocket] = []


class AnalysisRequest(BaseModel):
    """Request payload for data analysis"""
    query: str
    file_path: Optional[str] = None  # Use mock data if not provided


class AnalysisResponse(BaseModel):
    """Response payload for data analysis"""
    success: bool
    query: str
    result: dict
    agent_logs: list
    code: str
    execution_time: float
    attempts: int = 1


# In-memory store for live analysis logs (for WebSocket streaming)
current_analysis_logs: List[dict] = []


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "service": "ReportWise API",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    """
    Main analysis endpoint.
    
    Accepts user query and file path, orchestrates agent swarm.
    Returns result with agent logs and code.
    Guarantees valid chart data.
    """
    try:
        logger.info(f"Received analysis request: {request.query}")
        
        # Determine file path
        file_path = request.file_path or "mock_data/sales_data.csv"
        
        # Use data processor for multi-format support
        processor = get_processor()
        try:
            df, metadata = processor.load_data(file_path)
            logger.info(f"Loaded {metadata['format']} file: {len(df)} rows, {len(df.columns)} columns")
        except ValueError as e:
            logger.error(f"File load error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        
        # Get CSV preview for Manager Agent
        csv_preview = df.head(5).to_string()
        
        # Create sandbox executor
        sandbox = create_sandbox()
        logger.info("Created code sandbox")
        
        # Orchestrate full analysis with direct Gemini calls (async-safe via to_thread)
        logger.info("Starting direct Gemini orchestration...")
        start_time = datetime.utcnow()
        
        # Setup real-time websocket log publisher
        loop = asyncio.get_running_loop()
        
        def on_log(agent: str, message: str):
            payload = {
                "agent": agent,
                "message": message,
                "timestamp": datetime.utcnow().timestamp()
            }
            async def broadcast():
                for connection in active_connections:
                    try:
                        await connection.send_json(payload)
                    except Exception as e:
                        logger.warning(f"Error broadcasting log: {e}")
            asyncio.run_coroutine_threadsafe(broadcast(), loop)
        
        # Run synchronous orchestrator in worker thread to prevent blocking FastAPI loop
        analysis_result = await asyncio.to_thread(
            orchestrate_with_gemini_direct,
            csv_data=csv_preview,
            csv_path=file_path,
            user_query=request.query,
            sandbox_executor=sandbox,
            on_log=on_log
        )
        
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Orchestration completed in {execution_time:.2f}s")
        
        # Ensure valid chart data (validation and fallback generation)
        result_data = analysis_result.get("result", {})
        result_data = ensure_valid_chart_data(
            execution_result={"success": analysis_result.get("success"), "data": result_data},
            df=df
        )
        
        # Build response
        if not analysis_result.get("success"):
            logger.warning(f"Analysis had issues, providing fallback visualization")
            return {
                "success": True,
                "query": request.query,
                "result": result_data,
                "agent_logs": analysis_result.get("agent_logs", []),
                "code": "",
                "execution_time": execution_time,
                "note": "Analysis encountered issues. Showing generated visualization.",
            }
        
        # Success
        logger.info("Analysis successful with valid chart data")
        logger.info(f"Chart data present: {bool(result_data.get('chart_data'))}")
        
        return {
            "success": True,
            "query": request.query,
            "result": result_data,
            "agent_logs": analysis_result.get("agent_logs", []),
            "code": analysis_result.get("code", ""),
            "execution_time": execution_time,
            "attempts": analysis_result.get("attempts", 1),
            "metadata": {
                "file_format": metadata['format'],
                "rows": len(df),
                "columns": len(df.columns),
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed with exception: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/stream-logs")
async def websocket_logs(websocket: WebSocket):
    """
    WebSocket endpoint for real-time agent thought streaming.
    
    Keeps connection open to receive broadcast messages during analysis.
    """
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"WebSocket connected. Total connections: {len(active_connections)}")
    
    try:
        # Keep WebSocket connection open until client closes it
        while True:
            await websocket.receive_text()
    except Exception as e:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(active_connections)}")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    File upload endpoint. Supports multiple formats.
    
    Supports: CSV, Excel, JSON, Parquet, HDF5, ZIP archives
    Validates file format and saves to backend/uploads/ directory.
    """
    try:
        logger.info(f"Received file upload: {file.filename}")
        
        # Create upload directory
        upload_dir = Path("uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = upload_dir / file.filename
        contents = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Use data processor for validation
        processor = get_processor()
        try:
            df, metadata = processor.load_data(str(file_path))
            logger.info(f"File validated: {metadata['format']} with {len(df)} rows, {len(df.columns)} columns")
        except ValueError as e:
            logger.error(f"Invalid file: {str(e)}")
            file_path.unlink()  # Delete invalid file
            raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")
        
        logger.info(f"File uploaded successfully: {file_path}")
        
        return {
            "success": True,
            "filename": file.filename,
            "path": str(file_path),
            "format": metadata['format'],
            "rows": metadata['rows'],
            "columns": metadata['columns'],
            "column_names": metadata['column_names'],
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files")
async def list_uploaded_files():
    """
    List all uploaded data files.
    """
    try:
        upload_dir = Path("uploads")
        
        if not upload_dir.exists():
            return {"success": True, "files": []}
        
        files = []
        for f in upload_dir.glob("*"):
            if f.is_file():
                files.append({
                    "name": f.name,
                    "size_kb": f.stat().st_size / 1024,
                    "modified": pd.Timestamp(f.stat().st_mtime).isoformat()
                })
        
        logger.info(f"Listed {len(files)} uploaded files")
        
        return {
            "success": True,
            "files": sorted(files, key=lambda x: x['modified'], reverse=True),
        }
    
    except Exception as e:
        logger.error(f"Failed to list files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/data-schema")
async def get_data_schema(file_path: str):
    """
    Get detailed schema & data quality diagnostics for a file.
    """
    try:
        processor = get_processor()
        df, metadata = processor.load_data(file_path)
        schema = processor.detect_schema(df)
        
        # Calculate summary statistics
        total_cells = df.size
        missing_cells = int(df.isnull().sum().sum())
        completeness = float(((total_cells - missing_cells) / total_cells * 100) if total_cells > 0 else 100)
        duplicates = int(df.duplicated().sum())
        
        return {
            "success": True,
            "metadata": metadata,
            "schema": schema,
            "diagnostics": {
                "completeness": completeness,
                "duplicates": duplicates,
                "total_cells": total_cells,
                "missing_cells": missing_cells,
                "rows": len(df),
                "cols": len(df.columns)
            }
        }
    except Exception as e:
        logger.error(f"Failed to get schema for {file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export")
async def export_analysis(request: dict):
    """
    Export analysis results to multiple formats.
    
    Supports: Tableau CSV, Power BI JSON, Excel, JSON
    
    Request body:
    {
        "query": "user query",
        "file_path": "path/to/data",
        "format": "tableau|powerbi|all",
        "analysis_result": {...}
    }
    """
    try:
        query = request.get("query", "Analysis")
        file_path = request.get("file_path", "mock_data/sales_data.csv")
        export_format = request.get("format", "all")  # tableau, powerbi, all
        
        # Load data
        processor = get_processor()
        df, metadata = processor.load_data(file_path)
        
        logger.info(f"Exporting {export_format} format for: {query}")
        
        # Get export handler
        export_handler = get_export_handler()
        
        # Generate filename
        timestamp = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
        filename_base = f"export_{timestamp}"
        
        exports = {}
        
        if export_format in ["tableau", "all"]:
            path = export_handler.export_for_tableau(df, f"{filename_base}_tableau.csv")
            exports["tableau"] = {
                "format": "CSV (Tableau)",
                "path": str(path),
                "url": f"/exports/{path.name}"
            }
        
        if export_format in ["powerbi", "all"]:
            path = export_handler.export_for_powerbi(df, f"{filename_base}_powerbi.json")
            exports["powerbi"] = {
                "format": "JSON (Power BI)",
                "path": str(path),
                "url": f"/exports/{path.name}"
            }
        
        if export_format == "all":
            excel_path = export_handler.export_to_excel(df, f"{filename_base}.xlsx")
            exports["excel"] = {
                "format": "Excel",
                "path": str(excel_path),
                "url": f"/exports/{excel_path.name}"
            }
            
            json_path = export_handler.export_to_json(df, f"{filename_base}.json")
            exports["json"] = {
                "format": "JSON",
                "path": str(json_path),
                "url": f"/exports/{json_path.name}"
            }
        
        logger.info(f"Exported {len(exports)} files")
        
        return {
            "success": True,
            "query": query,
            "exports": exports,
            "metadata": metadata,
        }
    
    except Exception as e:
        logger.error(f"Export failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/exports/{filename}")
async def download_export(filename: str):
    """Download exported file."""
    try:
        file_path = Path("exports") / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        mime_map = {
            "csv": "text/csv",
            "json": "application/json",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "py": "text/x-python",
            "html": "text/html",
        }
        media_type = mime_map.get(ext, "application/octet-stream")
        
        logger.info(f"Downloading export: {filename}")
        
        return FileResponse(
            file_path,
            media_type=media_type,
            filename=filename,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/export-info")
async def get_export_info():
    """Get information about recent exports."""
    try:
        export_handler = get_export_handler()
        info = export_handler.get_export_info()
        logger.info("Retrieved export info")
        return info
    except Exception as e:
        logger.error(f"Failed to get export info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-report")
async def generate_report(request: dict):
    """
    Generate comprehensive business report.
    
    Request body:
    {
        "query": "user query",
        "file_path": "path/to/data",
        "analysis_result": {...}
    }
    """
    try:
        query = request.get("query", "Data Analysis Report")
        file_path = request.get("file_path", "mock_data/sales_data.csv")
        analysis_result = request.get("analysis_result", {})
        chart_data = request.get("chart_data", {})
        
        logger.info(f"Generating report for: {query}")
        
        # Load data
        processor = get_processor()
        df, metadata = processor.load_data(file_path)
        
        # Generate report
        report_generator = get_report_generator()
        report = report_generator.generate_full_report(
            df=df,
            query=query,
            analysis_result=analysis_result,
            chart_data=chart_data
        )
        
        logger.info(f"Report generated successfully")
        
        return {
            "success": True,
            "report": report,
            "download_url": f"/reports/{report['html_filename']}",
            "json_url": f"/reports/{report['json_filename']}",
        }
    
    except Exception as e:
        logger.error(f"Report generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ETLRequest(BaseModel):
    file_path: Optional[str] = None


@app.post("/generate-etl")
async def generate_etl(request: ETLRequest):
    """
    Generate an automated data cleaning and preprocessing ETL script.
    """
    try:
        file_path = request.file_path or "mock_data/sales_data.csv"
        logger.info(f"Generating ETL pipeline for: {file_path}")
        
        # Load the data preview & compute diagnostics
        processor = get_processor()
        df, metadata = processor.load_data(file_path)
        diagnostics = processor.detect_schema(df)
        
        # Create CSV preview
        csv_preview = df.head(10).to_csv(index=False)
        
        # Run AI generation in thread pool
        etl_data = await asyncio.to_thread(
            generate_etl_pipeline,
            csv_preview,
            diagnostics
        )
        
        # Save generated code to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        etl_filename = f"etl_pipeline_{timestamp}.py"
        
        exports_dir = Path("exports")
        exports_dir.mkdir(exist_ok=True)
        etl_file_path = exports_dir / etl_filename
        
        with open(etl_file_path, "w", encoding="utf-8") as f:
            f.write(etl_data.get("etl_code", ""))
            
        logger.info(f"ETL pipeline generated: {etl_filename}")
        
        return {
            "success": True,
            "recommendations": etl_data.get("recommendations", []),
            "etl_code": etl_data.get("etl_code", ""),
            "download_url": f"/exports/{etl_filename}"
        }
        
    except Exception as e:
        logger.error(f"ETL pipeline generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/{filename}")
async def download_report(filename: str):
    """Download generated report."""
    try:
        file_path = Path("reports") / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Report not found")
        
        logger.info(f"Downloading report: {filename}")
        
        return FileResponse(
            file_path,
            media_type="text/html" if filename.endswith(".html") else "application/json",
            filename=filename,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-deck")
async def generate_deck(request: dict):
    """
    Generate a presentation deck (8-10 slides with visualizations).
    
    Request body:
    {
        "query": "user query",
        "file_path": "path/to/data",
        "analysis_result": {...},
        "chart_data": {...}
    }
    """
    try:
        query = request.get("query", "Presentation Deck")
        file_path = request.get("file_path", "mock_data/sales_data.csv")
        analysis_result = request.get("analysis_result") or {}
        chart_data = request.get("chart_data") or {}
        
        logger.info(f"Generating presentation deck for: {query}")
        
        # Load data
        processor = get_processor()
        try:
            df, metadata = processor.load_data(file_path)
        except Exception as e:
            logger.error(f"Failed to load file: {str(e)}")
            raise HTTPException(status_code=400, detail=f"File not found or invalid: {file_path}")
        
        # Generate deck
        try:
            deck_generator = get_deck_generator()
            deck = deck_generator.generate_deck(
                df=df,
                query=query,
                analysis_result=analysis_result,
                chart_data=chart_data
            )
        except Exception as e:
            logger.error(f"Deck generation failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Deck generation failed: {str(e)}")
        
        logger.info(f"Deck generated successfully: {deck['deck_id']} with {deck['total_slides']} slides")
        
        return {
            "success": True,
            "deck": deck,
            "deck_id": deck["deck_id"],
            "total_slides": deck["total_slides"],
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deck generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/decks/{deck_id}")
async def get_deck(deck_id: str):
    """Get a specific deck by ID."""
    try:
        deck_path = Path("decks") / f"{deck_id}.json"
        
        if not deck_path.exists():
            raise HTTPException(status_code=404, detail="Deck not found")
        
        with open(deck_path, "r") as f:
            deck_data = json.load(f)
        
        logger.info(f"Retrieved deck: {deck_id}")
        
        return deck_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get deck: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/decks-list")
async def list_decks():
    """List all generated decks."""
    try:
        deck_dir = Path("decks")
        
        if not deck_dir.exists():
            return {"success": True, "decks": []}
        
        decks = []
        for deck_file in sorted(deck_dir.glob("*.json"), reverse=True)[:20]:
            with open(deck_file, "r") as f:
                deck_data = json.load(f)
            decks.append({
                "deck_id": deck_data["deck_id"],
                "title": deck_data.get("title", "Untitled"),
                "created": deck_data.get("created"),
                "total_slides": deck_data.get("total_slides", 0),
            })
        
        logger.info(f"Listed {len(decks)} decks")
        
        return {
            "success": True,
            "decks": decks,
        }
    
    except Exception as e:
        logger.error(f"Failed to list decks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── RAG & Agent Chat Models ────────────────────────────────────────────────

class AgentChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AgentChatRequest(BaseModel):
    message: str
    file_path: Optional[str] = None
    history: Optional[List[AgentChatMessage]] = []


class QuerySuggestionsRequest(BaseModel):
    partial_query: str
    schema_info: Optional[dict] = None
    file_path: Optional[str] = None


# ─── New Endpoints ────────────────────────────────────────────────────────────

@app.post("/rag-index")
async def rag_index(request: dict):
    """
    Index an uploaded file into the RAG vector store.
    Called automatically after upload, or on-demand.
    """
    try:
        file_path = request.get("file_path")
        if not file_path:
            raise HTTPException(status_code=400, detail="file_path is required")

        if is_indexed(file_path):
            return {"success": True, "message": "Already indexed", "store": get_store_info()}

        processor = get_processor()
        df, metadata = processor.load_data(file_path)

        # Run indexing in thread pool (embedding calls can be slow)
        n_chunks = await asyncio.to_thread(index_file, file_path, df)

        logger.info(f"RAG indexed '{file_path}' → {n_chunks} chunks")
        return {
            "success": True,
            "chunks_indexed": n_chunks,
            "file_path": file_path,
            "store": get_store_info(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG indexing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent-chat")
async def agent_chat(request: AgentChatRequest):
    """
    RAG-powered conversational agent endpoint.

    Uses the indexed file context to answer questions about uploaded data.
    Falls back to general Gemini response when no file is available.
    """
    try:
        message = request.message.strip()
        if not message:
            raise HTTPException(status_code=400, detail="message is required")

        # Build RAG context
        rag_context = ""
        if request.file_path:
            # Auto-index if not yet done
            if not is_indexed(request.file_path):
                try:
                    processor = get_processor()
                    df, _ = processor.load_data(request.file_path)
                    await asyncio.to_thread(index_file, request.file_path, df)
                except Exception as idx_err:
                    logger.warning(f"Auto-indexing failed: {idx_err}")

            rag_context = await asyncio.to_thread(
                build_context, message, request.file_path, 5, 3500
            )

        # Build conversation history
        history_text = ""
        if request.history:
            for msg in request.history[-6:]:  # last 6 turns
                role = "User" if msg.role == "user" else "Assistant"
                history_text += f"{role}: {msg.content}\n"

        # Compose prompt
        if rag_context and rag_context != "No data context available.":
            prompt = f"""You are ReportWise AI Assistant, an expert data analyst embedded in a business intelligence app.

You have access to the user's uploaded dataset. Use the context below to answer questions accurately.
If the answer cannot be found in the context, say so honestly.

{rag_context}

{'Conversation so far:' + chr(10) + history_text if history_text else ''}
User: {message}
Assistant:"""
        else:
            prompt = f"""You are ReportWise AI Assistant, an expert data analyst.
You help users understand data, build analyses, and interpret visualizations.

{'Conversation so far:' + chr(10) + history_text if history_text else ''}
User: {message}
Assistant:"""

        # Call Gemini
        try:
            response_text = await asyncio.to_thread(call_gemini, prompt)
        except Exception as gemini_err:
            error_str = str(gemini_err)
            logger.warning(f"Gemini API error encountered: {error_str}")
            
            # Check for different error types
            if "google_api_key" in error_str.lower() or "not set" in error_str.lower():
                logger.warning("API key not configured")
                response_text = f"""⚙️ **API Configuration Needed**

To use the AI analysis feature, please:

1. Get your Gemini API key from: https://aistudio.google.com/apikey
2. Add it to your environment:
   - Local: Update `backend/.env` with your key
   - Cloud: Set `GOOGLE_API_KEY` environment variable
3. Restart the backend

In the meantime, you can still:
- Upload and explore your data
- Create visualizations
- Export to Tableau or Power BI
- Generate reports and presentations"""
            elif "403" in error_str or "permission" in error_str.lower() or "denied" in error_str.lower():
                logger.warning("API key is invalid or restricted")
                response_text = f"""⚠️ **API Key Issue**

The provided API key has permission issues. Please:

1. Verify your API key is valid and active
2. Get a fresh key from: https://aistudio.google.com/apikey
3. Update your `.env` file with the new key
4. Restart the backend

In the meantime, use these features:
- Create visualizations
- Export to Tableau or Power BI
- Generate reports and presentations"""
            elif "quota" in error_str.lower() or "rate" in error_str.lower():
                logger.warning("API quota or rate limit exceeded")
                response_text = f"""⏳ **Service Temporarily Unavailable**

The AI service is experiencing high usage. Please try again in a few moments.

While you wait:
- Create and customize visualizations
- Export your data to other tools
- Generate automatic reports
- Create presentation decks"""
            else:
                logger.error(f"Unexpected Gemini error: {error_str}")
                response_text = f"""❌ **AI Service Error**

Error: {error_str[:100]}

Please try again, or use these alternatives:
- Create visualizations
- Export your data to Tableau/Power BI
- Generate reports and presentations"""
        
        return {
            "success": True,
            "response": response_text,
            "has_context": bool(rag_context and rag_context != "No data context available."),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent chat failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query-suggestions")
async def query_suggestions(request: QuerySuggestionsRequest):
    """
    Generate smart query suggestions based on partial input + data schema.
    Called with debounce from the frontend as the user types.
    """
    try:
        partial = request.partial_query.strip()
        if len(partial) < 3:
            return {"success": True, "suggestions": []}

        schema_summary = ""
        if request.schema_info:
            cols = list((request.schema_info.get("schema") or {}).keys())[:10]
            schema_summary = f"Available columns: {', '.join(cols)}"

        prompt = f"""You are a data analytics assistant. The user is typing a query into an analytics tool.
Generate exactly 4 short, actionable query suggestions that complete or expand on what they have typed.

{schema_summary}

User's partial query: "{partial}"

Respond with ONLY a JSON array of 4 suggestion strings. No markdown, no explanation.
Example: ["Show total sales by region", "Compare sales month over month", ...]"""

        raw = await asyncio.to_thread(call_gemini, prompt)

        # Parse suggestions
        import re
        suggestions = []
        try:
            # Try direct JSON parse
            suggestions = json.loads(raw)
        except Exception:
            # Fallback: extract strings from response
            matches = re.findall(r'"([^"]{10,120})"', raw)
            suggestions = matches[:4]

        if not isinstance(suggestions, list):
            suggestions = []

        return {
            "success": True,
            "suggestions": suggestions[:4],
        }

    except Exception as e:
        logger.error(f"Query suggestions failed: {e}")
        return {"success": True, "suggestions": []}  # Soft fail


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting NexusAnalytics FastAPI backend...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )

