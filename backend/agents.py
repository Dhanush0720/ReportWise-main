"""
NexusAnalytics Agent Definitions

Three-tier CrewAI architecture:
- Manager Agent: Analyzes data schema and generates execution plans
- Developer Agent: Writes and executes Python code to solve queries
- QA Critic Agent: Validates code output accuracy against user intent
"""

from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import logging

logger = logging.getLogger(__name__)


def get_gemini_llm():
    """
    Configure and return Gemini LLM for CrewAI agents.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    
    logger.info(f"Initializing Gemini LLM with model: {model_name}")
    
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=0.3,
        max_tokens=8000,
    )


def create_manager_agent(llm) -> Agent:
    """
    Manager Agent: Analyzes CSV schema and generates structured execution plan.
    Returns JSON with analysis steps and recommendations.
    """
    return Agent(
        role="Data Schema Analyst",
        goal="Analyze the provided dataset and create a clear, step-by-step execution plan to answer the user's query",
        backstory="""You are an expert data analyst. Your job is to:
1. Examine the CSV structure (columns, data types, sample values)
2. Understand the user's business question
3. Break down the query into concrete data manipulation steps
4. Specify which columns to use and what aggregations/filters are needed
5. Output ONLY a valid JSON plan (no markdown, no extra text) with this exact structure:
{
    "steps": [{"step": 1, "action": "...", "details": "..."}],
    "columns_to_use": ["col1", "col2"],
    "data_type": "time_series|comparison|distribution",
    "chart_type": "bar|line|scatter|pie",
    "summary": "Description of what code should do"
}

You think in steps and ensure clarity before code is written.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_developer_agent(llm) -> Agent:
    """
    Developer Agent: Writes and executes Python code based on the Manager's plan.
    Handles self-correction on execution errors.
    """
    return Agent(
        role="Python Developer & Code Executor",
        goal="Write clean, efficient Python code to analyze data and generate chart data based on the execution plan",
        backstory="""You are a senior Python engineer specializing in data analysis. Your job is to:
1. Read the execution plan from the Manager Agent
2. Write Python code using pandas and matplotlib to execute the plan
3. The code will be executed in an isolated sandbox with access to 'df' (loaded CSV), 'csv_path', and 'user_query' variables
4. Your code MUST output a 'result' variable with this JSON structure:
{
    "chart_data": {
        "labels": ["label1", "label2"],
        "values": [10, 20],
        "title": "Chart Title"
    },
    "summary": "Brief findings"
}
5. Always use defensive programming (check column existence, handle missing values)
6. Return ONLY valid Python code (no markdown, no explanations)

For example:
import pandas as pd
df = pd.read_csv(csv_path)
top_product = df.loc[df['sales'].idxmax()]
result = {
    "chart_data": {...},
    "summary": "..."
}

You write defensive code. You handle edge cases. You debug methodically.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_qa_agent(llm) -> Agent:
    """
    QA Critic Agent: Validates that code output matches user intent.
    Returns JSON with validation status and issues.
    """
    return Agent(
        role="QA Critic & Validator",
        goal="Verify that the code output accurately answers the user's query and contains no data anomalies",
        backstory="""You are a meticulous quality assurance specialist. Your job is to:
1. Review the execution plan from the Manager
2. Examine the code written by the Developer
3. Check the code output (result structure, data values, summary)
4. Verify that:
   - The output directly answers the user's question
   - Data values are reasonable (no NaNs, infinities, or logical errors)
   - The chart data structure is valid
   - The summary is accurate and insightful
5. Return ONLY a valid JSON response (no markdown):
{
    "status": "pass|fail",
    "issues": ["issue1", "issue2"],
    "summary": "Validation summary",
    "recommendation": "Ready for production|Needs revision"
}

You are detail-oriented and catch subtle bugs.""",
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def build_agents() -> dict:
    """
    Build and return all three agents with Gemini LLM.
    """
    llm = get_gemini_llm()
    
    return {
        "llm": llm,
        "manager": create_manager_agent(llm),
        "developer": create_developer_agent(llm),
        "qa": create_qa_agent(llm),
    }
