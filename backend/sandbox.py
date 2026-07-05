"""
NexusAnalytics Code Sandbox Execution

Isolated execution environment for user-generated Python code.
Captures stdout, stderr, execution time, and tracebacks.
Designed to run in AWS Lambda or Docker container.
"""

import sys
import io
import traceback
import time
import json
import logging
from contextlib import redirect_stdout, redirect_stderr
from typing import Dict, Any
from pathlib import Path

# Import data science libraries
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt

logger = logging.getLogger(__name__)


class CodeSandbox:
    """
    Isolated sandbox for executing data analysis Python code.
    """
    
    def __init__(self, max_retries: int = 3, timeout_seconds: float = 30):
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds
        self.execution_history = []
    
    def execute_code(
        self,
        code: str,
        csv_path: str,
        user_context: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Execute Python code in isolated sandbox.
        
        Args:
        - code: Python code string to execute
        - csv_path: Path to CSV file for analysis
        - user_context: Additional context (user query, etc.)
        
        Returns:
        - Dictionary with: success, output, error, traceback, execution_time, data
        """
        if user_context is None:
            user_context = {}
        
        start_time = time.time()
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        try:
            # Inject numpy and data science libraries
            import numpy as np
            
            # Create isolated namespace with safe builtins
            namespace = {
                'pd': pd,
                'np': np,
                'plt': plt,
                'json': json,
                'Path': Path,
                '__builtins__': {
                    'print': print,
                    'len': len,
                    'range': range,
                    'str': str,
                    'int': int,
                    'float': float,
                    'list': list,
                    'dict': dict,
                    'set': set,
                    'tuple': tuple,
                    'Exception': Exception,
                    'ValueError': ValueError,
                    'KeyError': KeyError,
                    'IndexError': IndexError,
                },
            }
            
            # Load df dynamically using the DataProcessor
            from data_processor import get_processor
            try:
                df_loaded, _ = get_processor().load_data(csv_path)
                namespace['df'] = df_loaded
            except Exception as e:
                logger.warning(f"Could not load data file {csv_path} with processor: {e}")
                # Fallback to simple read
                try:
                    namespace['df'] = pd.read_csv(csv_path)
                except Exception:
                    pass
            
            # Inject CSV path and context as variables
            namespace['csv_path'] = csv_path
            namespace['user_query'] = user_context.get('user_query', '')
            
            # Execute code with output capture
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                exec(code, namespace)
            
            execution_time = time.time() - start_time
            
            result = {
                "success": True,
                "output": stdout_capture.getvalue(),
                "error": None,
                "traceback": None,
                "execution_time": execution_time,
            }
            
            # Extract result data from namespace
            if 'result' in namespace:
                result['data'] = namespace['result']
                logger.info(f"Code execution successful. Result keys: {namespace['result'].keys()}")
            else:
                logger.warning("Code executed but no 'result' variable found in namespace")
                result['data'] = {}
            
            self.execution_history.append(result)
            return result
        
        except Exception as e:
            execution_time = time.time() - start_time
            error_traceback = traceback.format_exc()
            
            logger.error(f"Code execution error: {str(e)}\n{error_traceback}")
            
            result = {
                "success": False,
                "output": stdout_capture.getvalue(),
                "error": str(e),
                "traceback": error_traceback,
                "execution_time": execution_time,
            }
            
            self.execution_history.append(result)
            return result
    
    def execute_with_retry(
        self,
        initial_code: str,
        csv_path: str,
        user_query: str,
    ) -> Dict[str, Any]:
        """
        Execute code with self-correction retry loop.
        
        If code fails, uses execution error to guide re-write (via Developer Agent).
        Retries up to self.max_retries times.
        
        Args:
            initial_code: Python code string to execute
            csv_path: Path to CSV file
            user_query: User's original query
        
        Returns:
            Dictionary with success flag, data, attempts count, and error history
        """
        current_code = initial_code
        attempt = 0
        
        logger.info(f"Starting code execution with retry loop (max {self.max_retries} attempts)")
        
        while attempt < self.max_retries:
            attempt += 1
            logger.info(f"[SANDBOX] Attempt {attempt}/{self.max_retries}")
            
            result = self.execute_code(
                current_code,
                csv_path,
                {"user_query": user_query},
            )
            
            if result["success"]:
                result["attempts"] = attempt
                logger.info(f"[SANDBOX] Success on attempt {attempt}")
                return result
            else:
                # Code failed; extract error for potential re-write
                error_msg = result.get("error", "Unknown error")
                error_traceback = result.get("traceback", "")
                
                logger.warning(f"[SANDBOX] Error on attempt {attempt}: {error_msg}")
                logger.debug(f"Traceback:\n{error_traceback}")
                
                if attempt < self.max_retries:
                    # TODO: Call Developer Agent to rewrite code based on error
                    # For now, we just log and continue
                    logger.info(f"[SANDBOX] Would attempt rewrite (Developer Agent integration pending)")
                    # In future: current_code = developer_agent.rewrite_code(current_code, error_traceback)
        
        # All retries exhausted
        logger.error(f"[SANDBOX] Max retries ({self.max_retries}) exceeded")
        
        final_history = self.execution_history[-self.max_retries:] if self.execution_history else []
        
        return {
            "success": False,
            "attempts": attempt,
            "error": "Max retries exceeded without successful execution",
            "history": final_history,
        }


def create_sandbox() -> CodeSandbox:
    """Factory function to create a sandbox instance."""
    return CodeSandbox(max_retries=3, timeout_seconds=30)


# Example usage (for local testing)
if __name__ == "__main__":
    import sys
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    sandbox = create_sandbox()
    
    # Test code: load CSV and print info
    test_code = """
import pandas as pd
df = pd.read_csv(csv_path)
print(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
print(f"Columns: {list(df.columns)}")
print(f"\\nFirst row:\\n{df.iloc[0]}")
result = {
    "chart_data": {
        "labels": df['product'].head(5).tolist(),
        "values": df['q4_sales'].head(5).tolist(),
        "title": "Q4 Sales by Product"
    },
    "summary": f"Loaded {len(df)} products"
}
"""
    
    result = sandbox.execute_code(
        test_code,
        "backend/mock_data/sales_data.csv",
        {"user_query": "test"},
    )
    
    print("\n=== Execution Result ===")
    print(json.dumps(result, indent=2, default=str))

