# ReportWise AI

**Autonomous Multi-Agent Data Workforce & Conversational RAG Analytics** – Transform raw data into polished interactive dashboards, presentation slides, business reports, and pipelines on autopilot.

---

## Overview

ReportWise AI is a powerful business intelligence and data analytics platform featuring a three-tier multi-agent workforce (Manager → Developer → QA) that autonomously processes, cleans, analyzes, and visualizes datasets. 

By utilizing **Google Gemini 3.5 Flash** and **Gemini Embedding 2**, the system writes customized Python code, executes it in a secure sandbox, streams execution steps in real-time via WebSockets, self-corrects on code runtime exceptions, and validates results against user intent.

Additionally, a conversational **RAG (Retrieval-Augmented Generation)** assistant is embedded to allow natural language interaction with uploaded datasets, complemented by smart query autocompletion suggestions.

---

## Key Features

*   **Multi-Agent Swarm Orchestration**: Leverages CrewAI agents powered by Gemini for schema analysis, code execution, and QA validation.
*   **Conversational RAG Analyst**: Ask questions directly about your dataset using an interactive chat panel backed by an in-memory vector store.
*   **Robust Multi-Format Support**: Autodetect, parse, and validate **CSV, Excel (.xlsx, .xls), JSON, Parquet, HDF5, ZIP archives, and unstructured Text** datasets.
*   **Self-Correcting Code Sandbox**: Runs generated code safely and performs auto-correction loops in case of Python runtime errors.
*   **Comprehensive Deliverables**:
    *   **Interactive Visualizations**: Dynamic charts (bar, line, pie, scatter, area) powered by Recharts.
    *   **Presentation Decks**: 8–10 slide decks generated on-the-fly containing executive KPIs and trend charts.
    *   **PDF/HTML Business Reports**: Detailed business reports complete with summaries and quality diagnostics.
    *   **ETL Pipelines**: Automated code scripts generated to clean and preprocess raw datasets.
*   **Real-time Thought Streaming**: Streams agent logs and execution steps in real-time via WebSockets.
*   **Smart Query Suggestions**: Provides debounced, schema-aware query auto-completions as you type.

---

## Project Structure

```
Analysis Made Easy/
├── backend/                     # FastAPI Backend
│   ├── main.py                  # API router, WebSocket handlers & server entrypoint
│   ├── agents.py                # Agent definitions (Manager, Developer, QA)
│   ├── tasks.py                 # Swarm task definitions & workflow orchestration
│   ├── sandbox.py               # Safe Python sandbox code execution environment
│   ├── data_processor.py        # Loader & schema parser for multi-format files
│   ├── rag_service.py           # In-memory vector store and embedding matching
│   ├── report_generator.py      # PDF/HTML business report generator
│   ├── deck_generator.py        # Presentation slide generator
│   ├── export_handler.py        # Exporter to Tableau, Power BI, Excel & JSON
│   ├── chart_validator.py       # Visual data validator and fallback generator
│   ├── requirements.txt         # Python package dependencies
│   ├── .env                     # API key configurations
│   └── mock_data/               # Sample datasets for demo queries
│
├── frontend/                    # Next.js React Frontend
│   ├── src/
│   │   ├── app/                 # Page layouts and pages
│   │   ├── components/          # FileUpload, AIAgentPopup, TerminalLog, ChartDisplay, Dashboard
│   │   └── lib/                 # api.ts (Axios + WebSocket), Firebase, Firestore clients
│   ├── package.json             # NPM package manifest
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── tsconfig.json            # TypeScript configuration
│
├── figma/                       # Design assets and mockups
├── project_rules.md             # Development instructions and guidelines
├── .gitignore                   # Ignore rules
└── README.md                    # This project documentation
```

---

## Tech Stack

*   **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts (charting engine), Lucide icons.
*   **Backend**: FastAPI, Uvicorn, Python 3.11+.
*   **Analytics & Embeddings**: Pandas, NumPy, Google Generative AI (Gemini 3.5 Flash + Gemini Embedding 2).
*   **Orchestration**: CrewAI & Langchain Google GenAI.

---

## Quick Start (Local Development)

### Prerequisites
*   Node.js 18+ (with npm)
*   Python 3.10+ (with pip)
*   Google Gemini API Key

### 1. Set Up Backend

```bash
cd backend

# Create and activate python virtual environment
python -m venv venv
venv\Scripts\activate  # On macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Copy/create .env, add your Google Gemini API key:
# GOOGLE_API_KEY=your_gemini_api_key_here
# GEMINI_MODEL=gemini-3.5-flash

# Run the FastAPI server
python main.py
```
*Backend server runs on: `http://localhost:8000`*

### 2. Set Up Frontend

```bash
cd frontend

# Install package dependencies
npm install

# Create environment config (.env.local)
# Set API URL path: NEXT_PUBLIC_API_URL=http://localhost:8000

# Start dev server
npm run dev
```
*Frontend runs on: `http://localhost:3000`*

### 3. Verify System
1. Open `http://localhost:3000` in your web browser.
2. Select or upload any supported data file (or use the preloaded `sales_data.csv`).
3. Type a query in the dashboard search bar (e.g., *"Compare monthly sales"*).
4. Watch the multi-agent terminal stream reasoning and code blocks in real-time, displaying a dynamic chart.
5. Click the floating **ReportWise AI** chat icon at the bottom right to talk directly to the RAG conversational assistant.

---

## API Endpoints

### Data Swarm & Analysis
*   `POST /analyze`: Main endpoint to submit analytical queries. Runs the Manager → Developer → QA workflow and returns interactive chart data, code execution logs, and data attributes.
*   `WebSocket /stream-logs`: Subscribes to real-time WebSocket logs from the agent swarm as they work through the query.
*   `POST /query-suggestions`: Generates debounced query autocomplete suggestions based on the user's input and active dataset columns.

### RAG Assistant
*   `POST /rag-index`: Indexes an uploaded file into the in-memory numpy vector store.
*   `POST /agent-chat`: Converse with the dataset. Extracts relevant document snippets from the vector store and answers natural-language questions.

### Exports & Reporting
*   `POST /export`: Exports analysis results formatted for Tableau, Power BI, Excel, or JSON.
*   `POST /generate-report`: Generates a fully formatted business report (HTML/JSON).
*   `POST /generate-deck`: Generates a structured presentation slide deck.
*   `POST /generate-etl`: Generates automated Python cleaning and ETL scripts.
*   `GET /exports/{filename}` / `GET /reports/{filename}`: Download generated reports and pipelines.

### Data Management
*   `POST /upload`: Upload datasets (CSV, Excel, Parquet, JSON, HDF5, ZIP, TXT).
*   `GET /files`: List uploaded datasets.
*   `GET /data-schema`: Retrieve detailed quality diagnostics, missing values, duplicates, and column details.
*   `GET /health`: Server health check.

---

## License
MIT. Made for hackathon sprint and active development. Feel free to fork, adapt, and build!
