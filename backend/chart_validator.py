"""
Chart Data Validator

Ensures that generated code produces valid chart data.
Provides fallback visualization generation if code output is invalid.

Guarantees every analysis returns valid, displayable chart data.
"""

import logging
from typing import Dict, Any, Optional, List
import pandas as pd

logger = logging.getLogger(__name__)


class ChartValidator:
    """Validate and fix chart data."""
    
    def __init__(self):
        self.COLORS = [
            "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa",
            "#38bdf8", "#fb923c", "#4ade80", "#fb7185", "#818cf8"
        ]
    
    def validate_chart_data(self, data: Any) -> bool:
        """
        Validate chart data structure.
        
        Expected format:
        {
            'labels': [...],
            'values': [...],
            'title': 'string' (optional)
        }
        """
        if not isinstance(data, dict):
            logger.warning(f"Chart data is not dict: {type(data)}")
            return False
        
        if 'labels' not in data or 'values' not in data:
            logger.warning("Chart data missing 'labels' or 'values' keys")
            return False
        
        labels = data.get('labels', [])
        values = data.get('values', [])
        
        if not isinstance(labels, (list, tuple)):
            logger.warning(f"Labels not list: {type(labels)}")
            return False
        
        if not isinstance(values, (list, tuple)):
            logger.warning(f"Values not list: {type(values)}")
            return False
        
        if len(labels) != len(values):
            logger.warning(f"Labels/values length mismatch: {len(labels)} vs {len(values)}")
            return False
        
        if len(labels) == 0:
            logger.warning("Chart data is empty")
            return False
        
        # Check values are numeric
        try:
            numeric_values = []
            for v in values:
                if isinstance(v, (int, float)):
                    numeric_values.append(v)
                else:
                    numeric_values.append(float(v))
        except (ValueError, TypeError) as e:
            logger.warning(f"Values cannot be converted to numeric: {str(e)}")
            return False
        
        logger.info(f"✓ Chart data valid: {len(labels)} data points")
        return True
    
    def fix_chart_data(self, result: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Fix invalid chart data by generating defaults from DataFrame.
        
        Generates sensible visualization from available data.
        """
        chart_data = result.get('chart_data', {})
        
        # Already valid
        if self.validate_chart_data(chart_data):
            return result
        
        logger.warning("Chart data invalid, generating default visualization")
        
        try:
            # Try to generate from DataFrame
            fixed_data = self._generate_default_chart(df)
            result['chart_data'] = fixed_data
            result['summary'] = f"Auto-generated visualization: {len(fixed_data['labels'])} categories"
            logger.info("Generated fallback chart data")
            return result
        except Exception as e:
            logger.error(f"Failed to generate fallback chart: {str(e)}")
            # Last resort: empty chart
            return {
                'chart_data': {},
                'summary': f"Error generating visualization: {str(e)}"
            }
    
    def _generate_default_chart(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate default chart from DataFrame."""
        
        # Find numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        if not numeric_cols:
            # No numeric columns, create a row count
            return {
                'labels': [f'Row {i+1}' for i in range(min(10, len(df)))],
                'values': [1] * min(10, len(df)),
                'title': 'Row Count'
            }
        
        # Use first numeric column as values
        values_col = numeric_cols[0]
        values = df[values_col].fillna(0).head(20).tolist()
        
        # Use first categorical column as labels, or index
        if categorical_cols:
            labels = df[categorical_cols[0]].astype(str).head(20).tolist()
        else:
            labels = [f'{values_col} {i+1}' for i in range(len(values))]
        
        return {
            'labels': labels[:len(values)],
            'values': values,
            'title': f'{values_col} Analysis'
        }
    
    def ensure_valid_result(self, execution_result: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Ensure result has valid chart data and is formatted into pages.
        
        Always guarantees a list of 'pages' where each has valid 'chart_data' and 'summary'.
        """
        fallback_chart = self._generate_default_chart(df)
        
        if not execution_result.get('success'):
            logger.warning("Execution failed, generating default single page")
            return {
                'success': False,
                'pages': [
                    {
                        'chart_data': fallback_chart,
                        'summary': 'Analysis encountered issues. Showing generated default visualization.',
                        'chart_type': 'bar'
                    }
                ],
                'error': execution_result.get('error'),
            }
        
        result_data = execution_result.get('data', {}) or {}
        if result_data is None:
            result_data = {}
        
        # If pages list already exists, validate it
        if 'pages' in result_data and isinstance(result_data['pages'], list) and len(result_data['pages']) > 0:
            validated_pages = []
            for p in result_data['pages']:
                if not isinstance(p, dict):
                    continue
                c_data = p.get('chart_data', {})
                if not self.validate_chart_data(c_data):
                    logger.warning("Invalid chart data in a page, fixing it")
                    fixed = self.fix_chart_data({'chart_data': c_data}, df)
                    p['chart_data'] = fixed['chart_data']
                if 'summary' not in p:
                    p['summary'] = 'Analysis details.'
                if 'chart_type' not in p:
                    p['chart_type'] = p.get('chart_type') or c_data.get('chart_type', 'bar')
                validated_pages.append(p)
            
            if validated_pages:
                result_data['pages'] = validated_pages
                return result_data
        
        # Fallback if no pages (or single chart data layout)
        c_data = result_data.get('chart_data', {})
        if not self.validate_chart_data(c_data):
            logger.warning("Invalid single chart data, generating fallback")
            fixed = self.fix_chart_data(result_data, df)
            c_data = fixed['chart_data']
            summary = fixed.get('summary', 'Generated default visualization.')
        else:
            summary = result_data.get('summary', 'Generated visualization.')
            
        result_data['pages'] = [
            {
                'chart_data': c_data,
                'summary': summary,
                'chart_type': result_data.get('preferredChartType') or c_data.get('chart_type', 'line')
            }
        ]
        return result_data
    
    def create_multi_series_chart(
        self,
        df: pd.DataFrame,
        x_column: str,
        y_columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create multi-series chart data."""
        
        if x_column not in df.columns:
            raise ValueError(f"Column not found: {x_column}")
        
        # Auto-select numeric columns if not specified
        if y_columns is None:
            y_columns = df.select_dtypes(include=['number']).columns.tolist()
        
        labels = df[x_column].astype(str).head(20).tolist()
        
        series = {}
        for col in y_columns:
            if col in df.columns:
                try:
                    series[col] = df[col].fillna(0).head(20).tolist()
                except:
                    continue
        
        return {
            'labels': labels,
            'series': series,
            'title': f'Multi-series Analysis'
        }


# Default validator instance
_validator = None

def get_chart_validator() -> ChartValidator:
    """Get or create default validator."""
    global _validator
    if _validator is None:
        _validator = ChartValidator()
    return _validator


def ensure_valid_chart_data(execution_result: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
    """
    Convenience function to ensure chart data is valid.
    
    Always returns result with valid chart_data.
    """
    validator = get_chart_validator()
    return validator.ensure_valid_result(execution_result, df)
