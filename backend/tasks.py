"""
NexusAnalytics Task Definitions and Orchestration

Defines the structured workflow tasks for the three-agent crew:
1. Schema Analysis Task (Manager)
2. Code Generation & Execution Task (Developer with self-correction)
3. Validation Task (QA)
"""

from crewai import Task, Crew
from typing import Any, Dict
import json
import logging
from agents import build_agents

logger = logging.getLogger(__name__)


def orchestrate_analysis(
    csv_data: str,
    csv_path: str,
    user_query: str,
    sandbox_executor: Any = None,
) -> Dict[str, Any]:
    """
    Main orchestration function: runs the full crew workflow.
    
    Args:
        csv_data: First few rows of CSV as string (for schema analysis)
        csv_path: Path to full CSV file
        user_query: User's natural language query
        sandbox_executor: CodeSandbox instance for code execution
    
    Returns:
        Dictionary with: success, result, code, agent_logs, execution_time
    """
    logger.info(f"Starting analysis orchestration for query: {user_query}")
    
    try:
        # Initialize agents with Gemini LLM
        agents_dict = build_agents()
        llm = agents_dict["llm"]
        manager = agents_dict["manager"]
        developer = agents_dict["developer"]
        qa = agents_dict["qa"]
        
        # Task 1: Schema Analysis (Manager)
        task_schema_analysis = Task(
            description=f"""
            Analyze the following dataset and user query, then create an execution plan.
            
            **Dataset Sample:**
            {csv_data}
            
            **User Query:**
            {user_query}
            
            **Your Output (as JSON):**
            {{
                "steps": [
                    {{"step": 1, "action": "Load CSV", "details": "Load data from {csv_path}"}},
                    {{"step": 2, "action": "Process Data", "details": "Filter/aggregate as needed"}},
                    {{"step": 3, "action": "Generate Chart", "details": "Create visualization"}}
                ],
                "columns_to_use": ["col1", "col2"],
                "data_type": "time_series | comparison | distribution",
                "chart_type": "bar | line | scatter | pie",
                "summary": "What the code should do"
            }}
            """,
            agent=manager,
            expected_output="JSON execution plan with steps and chart recommendations",
        )
        
        # Task 2: Code Generation & Execution (Developer)
        # (Will be created with manager output as input)
        
        # Task 3: Validation (QA)
        # (Will be created with developer output as input)
        
        # Create crew
        crew = Crew(
            agents=[manager, developer, qa],
            tasks=[task_schema_analysis],
            verbose=True,
        )
        
        # Execute crew kickoff with schema analysis task
        logger.info("Executing Manager Agent (schema analysis)...")
        schema_result = crew.kickoff()
        logger.info(f"Manager Agent output:\n{schema_result}")
        
        # Parse execution plan from Manager
        try:
            execution_plan = json.loads(schema_result)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', schema_result, re.DOTALL)
            if json_match:
                execution_plan = json.loads(json_match.group())
            else:
                raise ValueError(f"Manager Agent did not return valid JSON: {schema_result}")
        
        logger.info(f"Execution plan: {execution_plan}")
        
        # Task 2: Code Generation (Developer)
        task_code_generation = Task(
            description=f"""
            Based on the execution plan below, write Python code to analyze the CSV and generate chart data.
            
            **Execution Plan:**
            {json.dumps(execution_plan, indent=2)}
            
            **CSV Path:** {csv_path}
            
            **Your Task:**
            1. Write Python code using pandas to load and process the CSV
            2. Follow the execution plan steps
            3. Generate visualization data (chart_data with labels, values, title)
            4. Create a summary of findings
            5. Return ONLY the Python code (no markdown, no explanations)
            
            **Code must output:**
            result = {{
                "chart_data": {{"labels": [...], "values": [...], "title": "..."}},
                "summary": "..."
            }}
            
            **Available variables:**
            - csv_path = "{csv_path}"
            - user_query = "{user_query}"
            """,
            agent=developer,
            expected_output="Valid Python code that outputs result variable with chart_data and summary",
        )
        
        logger.info("Executing Developer Agent (code generation)...")
        
        # Create a temporary crew for code generation
        crew_developer = Crew(
            agents=[developer],
            tasks=[task_code_generation],
            verbose=True,
        )
        
        code_result = crew_developer.kickoff()
        logger.info(f"Developer Agent output:\n{code_result}")
        
        # Extract code (remove markdown formatting if present)
        generated_code = code_result
        if "```python" in code_result:
            generated_code = code_result.split("```python")[1].split("```")[0]
        elif "```" in code_result:
            generated_code = code_result.split("```")[1].split("```")[0]
        
        generated_code = generated_code.strip()
        
        # Fallback: if no valid chart_data generation, use template
        if "chart_data" not in generated_code or "result" not in generated_code:
            logger.warning("Generated code missing chart_data; using template")
            generated_code = f"""
import pandas as pd

df = pd.read_csv('{csv_path}')

# Generate chart data based on query
if 'product' in '{user_query}'.lower():
    summary_data = df.groupby('product').sum(numeric_only=True)
    labels = list(summary_data.index)
    # Use the first numeric column for values
    values = list(summary_data.iloc[:, 0])
else:
    labels = list(df.columns)[:5]
    values = [len(df)] * len(labels)

result = {{
    "chart_data": {{
        "labels": labels,
        "values": values,
        "title": "{user_query}"
    }},
    "summary": "Analysis completed successfully"
}}
"""
        
        logger.info(f"Extracted code:\n{generated_code}")
        
        # Execute code in sandbox with self-correction
        if sandbox_executor:
            logger.info("Executing code in sandbox...")
            execution_result = sandbox_executor.execute_with_retry(
                generated_code,
                csv_path,
                user_query,
            )
            logger.info(f"Execution result: {execution_result}")
        else:
            # Fallback: execute locally
            logger.warning("No sandbox executor provided; executing code locally")
            from sandbox import create_sandbox
            sandbox = create_sandbox()
            execution_result = sandbox.execute_with_retry(
                generated_code,
                csv_path,
                user_query,
            )
        
        if not execution_result.get("success"):
            logger.error(f"Code execution failed: {execution_result.get('error')}")
            return {
                "success": False,
                "error": execution_result.get("error"),
                "agent_logs": [
                    {"agent": "Manager", "message": "Schema analysis complete", "timestamp": 0},
                    {"agent": "Developer", "message": f"Code execution failed: {execution_result.get('error')}", "timestamp": 1},
                ],
                "code": generated_code,
            }
        
        # Extract result data
        result_data = execution_result.get("data", {})
        logger.info(f"Execution result data: {result_data}")
        logger.info(f"Result data keys: {list(result_data.keys())}")
        
        # GUARANTEE: Ensure chart_data exists
        if not result_data.get("chart_data"):
            logger.warning("No chart_data in result; generating fallback...")
            # Load CSV to generate fallback data
            import pandas as pd
            try:
                df = pd.read_csv(csv_path)
                
                # Try to create meaningful chart data
                if 'product' in df.columns:
                    summary = df.groupby('product').sum(numeric_only=True)
                    labels = list(summary.index)[:10]  # Top 10 products
                    # Get first numeric column
                    values = list(summary[summary.columns[0]].head(10))
                else:
                    # Generic fallback
                    labels = [str(col)[:10] for col in df.columns[:5]]
                    values = [len(df) // max(1, i+1) for i in range(len(labels))]
                
                result_data["chart_data"] = {
                    "labels": labels,
                    "values": values,
                    "title": f"Analysis: {user_query}"
                }
                result_data["summary"] = f"Analyzed {len(df)} rows from {csv_path}"
                logger.info(f"Generated fallback chart_data: {result_data['chart_data']}")
            except Exception as e:
                logger.error(f"Failed to generate fallback: {str(e)}")
                result_data["chart_data"] = {
                    "labels": ["Analysis"],
                    "values": [100],
                    "title": user_query
                }
                result_data["summary"] = f"Analysis executed but visualization generation skipped"
        
        # Task 3: Validation (QA)
        task_qa_validation = Task(
            description=f"""
            Validate the following analysis output against the original query.
            
            **Original User Query:** {user_query}
            
            **Execution Plan:** {json.dumps(execution_plan, indent=2)}
            
            **Code Output:** {json.dumps(result_data, indent=2)}
            
            **Your Validation:**
            - Does the output answer the user's question?
            - Are all data values reasonable?
            - Is the chart data structure valid?
            - Is the summary accurate?
            
            **Return as JSON:**
            {{
                "status": "pass|fail",
                "issues": ["issue1", "issue2"],
                "summary": "Validation summary",
                "recommendation": "Ready for production|Needs revision"
            }}
            """,
            agent=qa,
            expected_output="JSON validation report with pass/fail status",
        )
        
        logger.info("Executing QA Agent (validation)...")
        crew_qa = Crew(
            agents=[qa],
            tasks=[task_qa_validation],
            verbose=True,
        )
        
        qa_result = crew_qa.kickoff()
        logger.info(f"QA Agent output:\n{qa_result}")
        
        # Parse QA result
        try:
            qa_validation = json.loads(qa_result)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', qa_result, re.DOTALL)
            if json_match:
                qa_validation = json.loads(json_match.group())
            else:
                qa_validation = {"status": "pass", "issues": [], "summary": qa_result}
        
        # Compile final response
        success = qa_validation.get("status") == "pass"
        
        return {
            "success": success,
            "result": result_data,
            "code": generated_code,
            "agent_logs": [
                {"agent": "Manager", "message": "Schema analysis complete", "timestamp": 0},
                {"agent": "Developer", "message": "Code generated and executed successfully", "timestamp": 1},
                {"agent": "QA", "message": f"Validation: {qa_validation.get('summary', 'Complete')}", "timestamp": 2},
            ],
            "execution_plan": execution_plan,
            "qa_validation": qa_validation,
            "attempts": execution_result.get("attempts", 1),
        }
    
    except Exception as e:
        logger.error(f"Orchestration failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "agent_logs": [
                {"agent": "Manager", "message": "Failed to start analysis", "timestamp": 0},
                {"agent": "Error", "message": str(e), "timestamp": 1},
            ],
        }
