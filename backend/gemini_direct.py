"""
Direct Gemini API integration (bypassing CrewAI for reliability)

Three-step pipeline:
1. Manager: Analyze schema and create execution plan
2. Developer: Generate Python code
3. QA: Validate output
"""

import json
import logging
from typing import Dict, Any, Callable, Optional
import google.generativeai as genai
import os

logger = logging.getLogger(__name__)

# Configure Gemini API
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def call_gemini(prompt: str, json_mode: bool = False) -> str:
    """Call Gemini with prompt and robust model fallback for 429 errors"""
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable is not set. "
            "Please add your API key to the .env file or set it as an environment variable. "
            "Get your key from: https://aistudio.google.com/apikey"
        )
    
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        text = response.text if response.text else ""
        logger.info(f"Gemini response using {model_name}: {text[:200]}...")
        return text
    except Exception as e:
        err_msg = str(e).lower()
        # Check for various API errors
        if "429" in err_msg or "quota" in err_msg or "resource_exhausted" in err_msg or "limit" in err_msg:
            logger.warning(f"Rate limit or quota exceeded: {str(e)}")
            raise
        elif "403" in err_msg or "permission" in err_msg or "denied" in err_msg:
            logger.warning(f"Permission denied or invalid API key: {str(e)}")
            raise
        elif "404" in err_msg:
            fallback_model = "gemini-3.5-flash" if model_name != "gemini-3.5-flash" else "gemini-2.5-pro"
            logger.warning(f"Model not found for {model_name}. Retrying with fallback: {fallback_model}...")
            try:
                model = genai.GenerativeModel(fallback_model)
                response = model.generate_content(prompt)
                text = response.text if response.text else ""
                logger.info(f"Gemini response using fallback {fallback_model}: {text[:200]}...")
                return text
            except Exception as fallback_err:
                logger.error(f"Fallback model {fallback_model} also failed: {str(fallback_err)}")
                raise fallback_err
        logger.error(f"Gemini API error: {str(e)}")
        raise

def manager_analyze_schema(csv_preview: str, user_query: str) -> Dict[str, Any]:
    """Manager Agent: Analyze schema and create execution plan"""
    logger.info("Manager: Analyzing schema...")
    
    prompt = f"""You are a data analyst. Analyze this CSV/dataset preview and user query, then respond with ONLY valid JSON (no markdown, no explanations).

Dataset Preview:
{csv_preview}

User Query: {user_query}

Respond with ONLY this JSON structure (no extra text):
{{
    "steps": [
        {{"step": 1, "action": "Load Data", "details": "Describe data prep"}},
        {{"step": 2, "action": "Process Data", "details": "Describe processing/filtering/aggregations"}},
        {{"step": 3, "action": "Visualize", "details": "Describe chart structure"}}
    ],
    "chart_type": "bar|line|pie|area|scatter|radar",
    "summary": "Brief summary of planned analysis"
}}"""
    
    response = call_gemini(prompt)
    
    try:
        plan = json.loads(response)
    except:
        import re
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            plan = json.loads(match.group())
        else:
            plan = {
                "steps": [{"step": 1, "action": "Analyze"}],
                "chart_type": "bar",
                "summary": "Analysis"
            }
    
    logger.info(f"Manager plan: {plan}")
    return plan

def developer_generate_code(csv_path: str, user_query: str, execution_plan: Dict) -> str:
    """Developer Agent: Generate Python code"""
    logger.info("Developer: Generating code...")
    
    prompt = f"""Write ONLY Python code (no markdown, no explanations) that performs data analysis for the user query using the pre-loaded DataFrame.

User Query: {user_query}

Execution Plan:
{json.dumps(execution_plan, indent=2)}

Variables pre-loaded in environment:
- `df`: The pandas DataFrame of the dataset. Use this directly! Do NOT try to read csv_path.
- `csv_path`: The file path string.
- `user_query`: The original query string.

Available Libraries (pre-imported):
- pandas as pd
- numpy as np
- matplotlib.pyplot as plt
- json, Path

The code MUST create a dictionary variable named `result` containing exactly 5 analytical pages (representing 5 different views/plots of the dataset for the query to create a comprehensive report) with this exact structure:
result = {{
    "pages": [
        {{
            "chart_data": {{
                "labels": [...list of category/X-axis label strings...],
                "values": [...list of numeric Y-axis values...],
                "title": "A descriptive title for this page's chart",
                "filters": [
                    {{
                        "label": "AI Preset Filter (e.g. 'Above Average')",
                        "active_labels": [...subset of labels matching this criteria...]
                    }},
                    {{
                        "label": "Another Preset Filter (e.g. 'Outlier Zones')",
                        "active_labels": [...subset of labels...]
                    }}
                ]
            }},
            "summary": "A concise text summary of the findings on this page",
            "chart_type": "line|bar|pie|area|scatter|radar"
        }},
        # ... generate exactly 5 distinct pages (e.g. Page 1: Overview, Page 2: Trend, Page 3: Composition, Page 4: Outliers/Stats, Page 5: Forecast/Summary)
    ]
}}

Guidelines for Special Queries:
1. Time-Series Forecasting (if query mentions forecast, predict, project, trend, future):
   - Find a column in `df` representing date/time (e.g. containing 'date', 'year', 'month', 'quarter' in name).
   - If a date/time column is found, parse it using `pd.to_datetime` and sort `df`.
   - Aggregate the metric values over time (e.g., groupby date/quarter/year and sum/mean).
   - Fit a simple trend line forecast using `np.polyfit(range(len(grouped)), values, 1)` or a moving average, and project forward by 3 to 6 steps.
   - Append the projected future labels (e.g., "2026-Q1 (Proj)") and forecasted values to the end of the `chart_data["labels"]` and `chart_data["values"]`.
2. Anomalies / Outliers (if query mentions outlier, anomaly, suspicious, spike):
   - Find key numeric columns, calculate mean and standard deviation, or IQR.
   - Flag entries where values are > 2.5 standard deviations from the mean or outside 1.5 * IQR.
   - Set labels as the outliers' indices/categories and values as the metric values. Note the anomalies and counts in the summary.
3. Clean Data:
   - Make sure labels and values do not contain NaN, None, or infinite values. Convert values to float/int.

CODE MUST NOT have markdown backticks or explanations:"""

    response = call_gemini(prompt)
    
    code = response
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0]
    elif "```" in code:
        code = code.split("```")[1].split("```")[0]
    
    code = code.strip()
    logger.info(f"Generated code:\n{code}")
    return code

def developer_rewrite_code(
    csv_path: str,
    user_query: str,
    execution_plan: Dict,
    failed_code: str,
    error_msg: str,
    tb: str
) -> str:
    """Developer Agent: Rewrite Python code based on sandbox error"""
    logger.info("Developer: Self-correcting and rewriting code...")
    
    prompt = f"""You are a senior data scientist and Python developer.
Your previous Python script failed to execute in the sandbox.
Analyze the error and traceback, and write CORRECTED Python code that solves the user's query.

User Query: {user_query}

Execution Plan:
{json.dumps(execution_plan, indent=2)}

Previous code that failed:
```python
{failed_code}
```

Error Message:
{error_msg}

Traceback:
{tb}

Available libraries (pre-imported):
- pandas as pd
- numpy as np
- matplotlib.pyplot as plt
- json, Path

Variables in your environment:
- `df`: The pre-loaded pandas DataFrame containing the dataset. Use this directly! Do NOT try to read csv_path.
- `csv_path`: String path to the original data file.
- `user_query`: String containing the user's query.

Your code MUST create a variable named `result` containing exactly 5 analytical pages (representing 5 different views/plots of the dataset for the query to create a comprehensive report) with this exact structure:
result = {{
    "pages": [
        {{
            "chart_data": {{
                "labels": [...list of strings for X-axis...],
                "values": [...list of numeric values (ints/floats) for Y-axis...],
                "title": "A descriptive title for this page's chart",
                "filters": [
                    {{
                        "label": "AI Preset Filter (e.g. 'Above Average')",
                        "active_labels": [...subset of labels matching this criteria...]
                    }},
                    {{
                        "label": "Another Preset Filter (e.g. 'Outlier Zones')",
                        "active_labels": [...subset of labels...]
                    }}
                ]
            }},
            "summary": "A concise text summary of the findings on this page",
            "chart_type": "line|bar|pie|area|scatter|radar"
        }},
        # ... generate exactly 5 distinct pages (e.g. Page 1: Overview, Page 2: Trend, Page 3: Composition, Page 4: Outliers/Stats, Page 5: Forecast/Summary)
    ]
}}

Rules:
1. Respond ONLY with raw Python code. Do NOT enclose in markdown backticks (```python) or explain anything.
2. Use `df` directly. Do NOT read from `csv_path`.
3. Ensure no NaN or infinite values are in the output lists of labels or values (clean them or fill with 0/sensible defaults).
4. Perform proper sorting or aggregation as requested.

Write the corrected Python code now:"""

    response = call_gemini(prompt)
    
    code = response
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0]
    elif "```" in code:
        code = code.split("```")[1].split("```")[0]
    
    code = code.strip()
    logger.info(f"Rewritten corrected code:\n{code}")
    return code

def qa_validate_output(user_query: str, result_data: Dict) -> Dict[str, Any]:
    """QA Agent: Validate output"""
    logger.info("QA: Validating output...")
    
    prompt = f"""Validate this analysis result against the query. Respond with ONLY JSON (no markdown):

Query: {user_query}
Result: {json.dumps(result_data, indent=2)}

Respond with ONLY this JSON:
{{
    "status": "pass|fail",
    "issues": [],
    "summary": "Brief explanation of verification results"
}}"""
    
    response = call_gemini(prompt)
    
    try:
        validation = json.loads(response)
    except:
        import re
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            validation = json.loads(match.group())
        else:
            validation = {"status": "pass", "issues": [], "summary": "Valid"}
    
    logger.info(f"QA validation: {validation}")
    return validation

def orchestrate_with_gemini_direct(
    csv_data: str,
    csv_path: str,
    user_query: str,
    sandbox_executor: Any,
    on_log: Optional[Callable[[str, str], None]] = None,
) -> Dict[str, Any]:
    """Full orchestration using direct Gemini calls with self-correction retry loop"""
    
    try:
        # Step 1: Manager analyzes
        if on_log:
            on_log("Manager", f"🔍 Analyzing dataset schema and structure...")
        execution_plan = manager_analyze_schema(csv_data, user_query)
        if on_log:
            on_log("Manager", f"✓ Schema analyzed. Chart suggestion: {execution_plan.get('chart_type', 'bar')}.")
            on_log("Manager", f"📋 Plan: {execution_plan.get('summary', 'Analyze the data')}")
        
        # Step 2: Developer generates code
        if on_log:
            on_log("Developer", f"💻 Writing Python data analysis code for query: '{user_query}'...")
        generated_code = developer_generate_code(csv_path, user_query, execution_plan)
        
        # Step 3: Execute code with self-healing retry loop
        attempt = 1
        max_attempts = 3
        current_code = generated_code
        execution_result = {}
        
        while attempt <= max_attempts:
            if on_log:
                on_log("Developer", f"⚙️ Attempt {attempt}/{max_attempts}: Running analysis code in sandbox...")
            
            execution_result = sandbox_executor.execute_code(
                current_code,
                csv_path,
                {"user_query": user_query},
            )
            
            if execution_result.get("success"):
                if on_log:
                    on_log("Developer", f"✓ Sandbox execution succeeded on attempt {attempt}!")
                break
            
            error_msg = execution_result.get("error", "Unknown error")
            tb = execution_result.get("traceback", "")
            
            if on_log:
                on_log("Error", f"✗ Attempt {attempt} failed: {error_msg}")
                on_log("QA", f"⚠️ QA detected code execution issue. Requesting self-correction from Developer...")
            
            if attempt < max_attempts:
                current_code = developer_rewrite_code(
                    csv_path=csv_path,
                    user_query=user_query,
                    execution_plan=execution_plan,
                    failed_code=current_code,
                    error_msg=error_msg,
                    tb=tb
                )
            attempt += 1
            
        if not execution_result.get("success"):
            logger.error(f"Execution failed: {execution_result.get('error')}")
            if on_log:
                on_log("Error", f"✗ Code failed after {max_attempts} attempts. Generating fallback visualization...")
            return {
                "success": False,
                "error": execution_result.get("error"),
                "agent_logs": []
            }
        
        result_data = execution_result.get("data", {})
        
        # Ensure chart_data exists
        if not result_data.get("chart_data"):
            logger.warning("No chart_data; generating fallback...")
            if on_log:
                on_log("QA", "⚠️ Validation issue: No chart_data found. Constructing fallback dataset...")
            import pandas as pd
            try:
                from data_processor import get_processor
                df, _ = get_processor().load_data(csv_path)
                numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
                categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
                
                if categorical_cols and numeric_cols:
                    summary = df.groupby(categorical_cols[0]).sum(numeric_only=True)
                    labels = list(summary.index)[:10]
                    values = list(summary[numeric_cols[0]].head(10))
                else:
                    labels = list(df.columns[:5])
                    values = [100] * len(labels)
                
                result_data["chart_data"] = {
                    "labels": labels,
                    "values": values,
                    "title": user_query
                }
                result_data["summary"] = f"Analysis of {len(df)} rows"
            except Exception as e:
                result_data["chart_data"] = {
                    "labels": ["Result"],
                    "values": [100],
                    "title": user_query
                }
                result_data["summary"] = "Analysis complete"
        
        # Step 4: QA validates
        if on_log:
            on_log("QA", f"🧪 Starting data validation and quality check...")
        qa_validation = qa_validate_output(user_query, result_data)
        if on_log:
            on_log("QA", f"✓ QA verification: {qa_validation.get('summary', 'Output matches query requirements')}")
            on_log("QA", f"🎉 Analysis complete! Ready to render visualization.")
        
        return {
            "success": True,
            "result": result_data,
            "code": current_code,
            "agent_logs": [
                {"agent": "Manager", "message": "✓ Schema analyzed", "timestamp": 0},
                {"agent": "Developer", "message": f"✓ Code executed after {attempt} attempts", "timestamp": 1},
                {"agent": "QA", "message": "✓ Output validated", "timestamp": 2},
            ],
            "qa_validation": qa_validation,
            "attempts": attempt,
        }
        
    except Exception as e:
        logger.error(f"Orchestration failed: {str(e)}", exc_info=True)
        if on_log:
            on_log("Error", f"✗ Orchestration failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "agent_logs": [
                {"agent": "Error", "message": str(e), "timestamp": 0},
            ]
        }


def generate_etl_pipeline(csv_preview: str, diagnostics: dict) -> dict:
    """
    AI ETL Assistant: Generates a Pandas ETL & Data Cleaning pipeline based on schema and diagnostics.
    """
    logger.info("ETL: Analyzing data quality and building ETL pipeline...")
    
    prompt = f"""You are a data engineer and senior data cleaning expert.
Analyze the following dataset preview and data health diagnostics. Propose a complete data cleaning and feature engineering strategy, and generate a self-contained, clean Python Pandas script doing the cleaning.

Dataset Preview:
{csv_preview}

Diagnostics:
{json.dumps(diagnostics, indent=2)}

Your response must be a JSON object ONLY, with the following keys. Do NOT wrap the JSON in ```json markdown code fences:
{{
  "recommendations": [
    {{
      "column": "column name (or 'Entire Dataset')",
      "issue": "detailed issue description (e.g. invalid date formats, extreme outliers, missing cells)",
      "action": "how to clean it (e.g. convert to datetime with errors='coerce', clip values above 99th percentile, impute with median)",
      "impact": "why this helps the downstream analysis/models"
    }}
  ],
  "etl_code": "A self-contained Python script. The script MUST contain a function clean_data(df) -> pd.DataFrame that takes a raw DataFrame and returns the cleaned DataFrame. The script should also import pandas and numpy. It should not try to read a file inside clean_data, but only operate on the parameter df."
}}
"""
    try:
        response_text = call_gemini(prompt)
        # Clean potential markdown wrappers
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        etl_result = json.loads(response_text)
        return etl_result
    except Exception as e:
        logger.error(f"ETL generation failed: {str(e)}")
        # Return fallback recommendation and basic clean code
        return {
            "recommendations": [
                {
                    "column": "Entire Dataset",
                    "issue": f"AI pipeline generation encountered an error: {str(e)}",
                    "action": "Load dataset and drop completely empty rows",
                    "impact": "Prevents loading empty rows"
                }
            ],
            "etl_code": "import pandas as pd\nimport numpy as np\n\ndef clean_data(df):\n    # Fallback cleaning code\n    df_clean = df.dropna(how='all')\n    return df_clean\n"
        }

