# Pitch Deck Guide & Mentor Q&A Bank

This document contains a structured slide-by-slide outline to fill in your presentation (PPT) and a comprehensive bank of the most common and difficult questions mentors/judges will ask about **ReportWise AI**, along with strong, technical answers.

---

## Part 1: Pitch Deck (PPT) Structure

### Slide 1: Title Slide (The Hook)
*   **Slide Title**: ReportWise AI
*   **Subtitle**: Autonomous Multi-Agent Data Workforce & Conversational RAG Analytics
*   **Tagline**: "Transform raw data into polished business dashboards, presentation slides, and reports on autopilot."
*   **Visual Suggestion**: Logo and a mockup screenshot of the clean dashboard with the floating AI assistant bubble active.
*   **Speaker Notes**: Start by highlighting that data is everywhere, but the ability to quickly extract insights is locked behind technical skill gaps or long turnaround times from data departments. ReportWise AI solves this instantly.

### Slide 2: The Problem
*   **Bullet Points**:
    *   **Data Silos & Mismatched Formats**: Raw data is scattered across CSVs, Excels, Parquets, and JSONs.
    *   **The Analyst Bottleneck**: Business leaders wait hours or days for simple dashboard updates.
    *   **The LLM Trust Gap**: Standard chat assistants hallucinate statistics, write buggy code that crashes, and present data security risks.
*   **Visual Suggestion**: A comparison graphic showing "Manual Data Wrangling (Days)" vs. "Awaiting IT/Analyst Support (Weeks)".

### Slide 3: The Solution (ReportWise AI)
*   **Bullet Points**:
    *   **Multi-Agent Swarm**: An autonomous workforce that writes, tests, and self-corrects data analysis code in real-time.
    *   **Conversational RAG Chat**: Ask natural language questions directly to the uploaded file's data points.
    *   **Actionable Deliverables**: Generates interactive charts, complete HTML/PDF reports, fully populated presentation slide decks, and automated ETL cleaning pipelines.
*   **Visual Suggestion**: Icons representing "Upload Data" ➔ "Agent Swarm reasons/fixes code" ➔ "Interactive Dashboards & Deliverables".

### Slide 4: System Architecture (How It Works)
*   **Bullet Points**:
    *   **Manager Agent (Data Schema Analyst)**: Examines dataset schema & preview, detects types, and maps an execution plan.
    *   **Developer Agent (Code Writer & Executor)**: Generates Pandas code and runs it inside a secure sandbox.
    *   **Self-Correction Loop**: Catches exceptions and feeds trackbacks back to the developer agent to debug and rewrite code (up to 3 retries).
    *   **QA Critic Agent (Validator)**: Checks code outputs against user intent and guarantees valid chart structures.
*   **Visual Suggestion**: A workflow diagram illustrating the Manager ➔ Developer ➔ Sandbox ➔ Error Check ➔ QA Validator loop.

### Slide 5: Tech Stack & Key Innovations
*   **Bullet Points**:
    *   **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts.
    *   **Backend & Swarm**: FastAPI, CrewAI, Langchain.
    *   **Intelligence Core**: Google Gemini 3.5 Flash & Gemini Embedding 2.
    *   **RAG Engine**: Pure NumPy cosine-similarity vector index matching (transient, zero database cost).
    *   **File Parser**: Pandas data processor supporting CSV, Excel, JSON, Parquet, HDF5, ZIP.

### Slide 6: Business Value & Summary
*   **Bullet Points**:
    *   **98% Time Reduction**: Go from raw upload to slide decks or reports in under 10 seconds.
    *   **Privacy First**: Secure sandboxing ensures user data stays localized.
    *   **Cost-Efficient**: Utilizing Gemini 3.5 Flash and in-memory indexes keeps API cost near zero.
*   **Call to Action**: "Empower every business user to be their own data scientist."

---

## Part 2: Mentor & Judge Q&A Bank

### 1. Security & Code Execution
> **Q: How does the system execute AI-generated code safely without opening up vulnerability risks (e.g., shell injection, system file deletions)?**

*   **Answer**: "In our architecture, we separate the generation layer from execution. The generated Python code runs inside a isolated execution sandbox (`sandbox.py`). For a production rollout, this sandbox executes code inside a stateless, ephemeral Docker container or an AWS Lambda function with strict resource constraints, network isolation, and read-only file access. The code cannot execute arbitrary shell commands or touch the host machine's resources."

### 2. Handling Large Datasets
> **Q: What happens when the uploaded dataset is extremely large (e.g., millions of rows)? How do you prevent context window limits and high token costs?**

*   **Answer**: "We never feed raw row data to the LLM. Instead:
    1.  **Metadata Summary**: The backend parses the data locally and generates a metadata schema (column names, datatypes, null counts, statistical descriptions, and a 5-row preview). Only this metadata is sent to the Manager Agent.
    2.  **RAG Chunking**: For conversational chat, we chunk the dataset, embed it using `gemini-embedding-2`, and build an in-memory index. When a user asks a question, we run cosine similarity and only feed the top 5 most relevant data chunks (under 3,500 characters) into the context window, keeping token costs minimal and response times fast."

### 3. Agent Self-Correction
> **Q: How robust is the Developer Agent's self-correction loop? What happens if it gets stuck in an infinite debug cycle?**

*   **Answer**: "The self-correction loop has a strict retry limit of 3 attempts. When code execution fails in the sandbox, we capture the Python traceback and feed it directly back to the Developer Agent, asking it to fix its syntax or type mismatch. If the limit is reached without success, the system triggers `chart_validator.py` which generates a fallback visualization from the dataframe automatically, ensuring the user is never left with an empty screen or a raw error message."

### 4. Vector Database Selection
> **Q: Why did you build an in-memory NumPy vector store rather than using a vector database like ChromaDB, Pinecone, or pgvector?**

*   **Answer**: "Because of lifecycle matching and performance. Datasets uploaded by business users are transient and session-specific—they don't need persistent, global search. Running an external database creates network overhead, latency, and subscription costs. By using a pure NumPy-based cosine similarity store in memory, we achieve sub-millisecond retrieval speeds locally, and the data is naturally cleaned up when the user closes their session, which aligns with data privacy standards."

### 5. Multi-Agent Swarm vs. Single Prompt Code Generation
> **Q: Why build a complex three-agent swarm (Manager/Dev/QA) when you could just ask a single LLM prompt to generate the code and charts?**

*   **Answer**: "A single prompt is single-pass; it has no self-evaluation or error correction. If the model makes a syntax error or hallucinates a column name, the app breaks. Our multi-agent loop introduces a clear separation of concerns. The Manager focuses entirely on planning, the Developer focuses on engineering, and the QA Critic acts as the evaluator. The self-correction loop between Dev and Sandbox simulates the actual workflow of a human coder, yielding a significantly higher query success rate."

### 6. Dealing with Hallucinations
> **Q: How do you verify that the numbers and statistical aggregates shown in reports and presentations are factually accurate to the dataset?**

*   **Answer**: "We enforce this by keeping data execution programmatic. The LLM does not perform mathematical calculations or count totals itself; it only writes the Python code that does. The code is executed directly against the raw Pandas DataFrame in the sandbox. The numbers rendered on the screen are the direct output of Python's math and statistics libraries, eliminating conversational LLM math hallucinations."
