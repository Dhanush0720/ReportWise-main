"""
Multi-format Data Processor

Supports:
- CSV, Excel (.xlsx, .xls)
- JSON (flat and nested)
- Parquet, HDF5
- ZIP archives (auto-extract)
- Unstructured text data parsing

Handles data validation, preview generation, and format conversion.
"""

import os
import io
import json
import logging
import zipfile
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# Supported formats
SUPPORTED_FORMATS = {
    '.csv': 'CSV',
    '.xlsx': 'Excel',
    '.xls': 'Excel',
    '.json': 'JSON',
    '.parquet': 'Parquet',
    '.h5': 'HDF5',
    '.hdf5': 'HDF5',
    '.zip': 'ZIP Archive',
    '.txt': 'Text',
}


class DataProcessor:
    """Multi-format data processor with validation and preview generation."""
    
    def __init__(self, max_preview_rows: int = 10, max_file_size_mb: int = 100):
        self.max_preview_rows = max_preview_rows
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
    
    def validate_file(self, file_path: str) -> Tuple[bool, str]:
        """Validate file exists and is supported format."""
        path = Path(file_path)
        
        if not path.exists():
            return False, f"File not found: {file_path}"
        
        if not path.is_file():
            return False, f"Path is not a file: {file_path}"
        
        if path.stat().st_size > self.max_file_size_bytes:
            return False, f"File exceeds max size of {self.max_file_size_bytes / 1024 / 1024:.0f}MB"
        
        if path.suffix.lower() not in SUPPORTED_FORMATS:
            return False, f"Unsupported format: {path.suffix}. Supported: {', '.join(SUPPORTED_FORMATS.keys())}"
        
        return True, "Valid"
    
    def load_data(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Load data from any supported format.
        
        Returns:
            (DataFrame, metadata_dict)
        """
        is_valid, msg = self.validate_file(file_path)
        if not is_valid:
            raise ValueError(msg)
        
        path = Path(file_path)
        file_ext = path.suffix.lower()
        
        logger.info(f"Loading {file_ext} file: {file_path}")
        
        if file_ext == '.csv':
            return self._load_csv(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            return self._load_excel(file_path)
        elif file_ext == '.json':
            return self._load_json(file_path)
        elif file_ext in ['.parquet']:
            return self._load_parquet(file_path)
        elif file_ext in ['.h5', '.hdf5']:
            return self._load_hdf5(file_path)
        elif file_ext == '.zip':
            return self._load_zip(file_path)
        elif file_ext == '.txt':
            return self._load_text(file_path)
        else:
            raise ValueError(f"Unsupported format: {file_ext}")
    
    def _load_csv(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load CSV file."""
        try:
            df = pd.read_csv(file_path)
            return df, {
                'format': 'CSV',
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
            }
        except Exception as e:
            logger.error(f"CSV load error: {str(e)}")
            raise ValueError(f"Invalid CSV file: {str(e)}")
    
    def _load_excel(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load Excel file (.xlsx, .xls)."""
        try:
            # Try to detect sheet names
            excel_file = pd.ExcelFile(file_path)
            sheet_name = excel_file.sheet_names[0]  # Use first sheet
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            logger.info(f"Loaded Excel sheet '{sheet_name}' with {len(df)} rows")
            
            return df, {
                'format': 'Excel',
                'sheet': sheet_name,
                'available_sheets': excel_file.sheet_names,
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
            }
        except Exception as e:
            logger.error(f"Excel load error: {str(e)}")
            raise ValueError(f"Invalid Excel file: {str(e)}")
    
    def _load_json(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load JSON file (supports array of objects and single object)."""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Handle array of objects or single object
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                # Try to find array in dict
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        df = pd.DataFrame(value)
                        logger.info(f"Used '{key}' field from JSON object")
                        break
                else:
                    # Single object case
                    df = pd.DataFrame([data])
            else:
                raise ValueError("JSON must contain array or object")
            
            return df, {
                'format': 'JSON',
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
            }
        except Exception as e:
            logger.error(f"JSON load error: {str(e)}")
            raise ValueError(f"Invalid JSON file: {str(e)}")
    
    def _load_parquet(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load Parquet file."""
        try:
            df = pd.read_parquet(file_path)
            return df, {
                'format': 'Parquet',
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
            }
        except Exception as e:
            logger.error(f"Parquet load error: {str(e)}")
            raise ValueError(f"Invalid Parquet file: {str(e)}")
    
    def _load_hdf5(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load HDF5 file."""
        try:
            # List available keys in HDF5
            with pd.HDFStore(file_path, mode='r') as store:
                keys = store.keys()
                if not keys:
                    raise ValueError("No datasets found in HDF5 file")
                key = keys[0]  # Use first key
                df = store[key]
                logger.info(f"Loaded HDF5 key '{key}'")
            
            return df, {
                'format': 'HDF5',
                'key': key,
                'available_keys': keys,
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
            }
        except Exception as e:
            logger.error(f"HDF5 load error: {str(e)}")
            raise ValueError(f"Invalid HDF5 file: {str(e)}")
    
    def _load_zip(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load data from ZIP archive (extracts first supported file)."""
        try:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                # Find first supported data file
                for file_info in zip_ref.filelist:
                    ext = Path(file_info.filename).suffix.lower()
                    if ext in ['.csv', '.xlsx', '.xls', '.json', '.parquet']:
                        # Extract to temp
                        with tempfile.TemporaryDirectory() as tmpdir:
                            zip_ref.extract(file_info, tmpdir)
                            temp_file = Path(tmpdir) / file_info.filename
                            logger.info(f"Extracted {file_info.filename} from ZIP")
                            return self.load_data(str(temp_file))
                
                raise ValueError("No supported data files found in ZIP")
        except Exception as e:
            logger.error(f"ZIP load error: {str(e)}")
            raise ValueError(f"Invalid ZIP file: {str(e)}")
    
    def _load_text(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Load unstructured text and parse as CSV or line-based data."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Try to parse as CSV
            try:
                df = pd.read_csv(io.StringIO(content))
                logger.info("Text file parsed as CSV")
            except:
                # Parse as line-based data
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                df = pd.DataFrame({
                    'line_number': range(1, len(lines) + 1),
                    'content': lines
                })
                logger.info(f"Text file parsed as {len(lines)} lines")
            
            return df, {
                'format': 'Text',
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.astype(str).to_dict(),
            }
        except Exception as e:
            logger.error(f"Text load error: {str(e)}")
            raise ValueError(f"Invalid Text file: {str(e)}")
    
    def get_preview(self, file_path: str, rows: Optional[int] = None) -> Dict[str, Any]:
        """Get data preview without full load."""
        if rows is None:
            rows = self.max_preview_rows
        
        df, metadata = self.load_data(file_path)
        
        # Generate preview
        preview_df = df.head(rows)
        
        return {
            'metadata': metadata,
            'preview': preview_df.to_dict('records'),
            'preview_rows': min(rows, len(df)),
            'total_rows': len(df),
        }
    
    def detect_schema(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect column types, numeric/categorical columns, and outlier statistics."""
        schema = {}
        
        for col in df.columns:
            dtype = str(df[col].dtype)
            is_numeric = bool(pd.api.types.is_numeric_dtype(df[col]))
            is_categorical = df[col].dtype == 'object' or df[col].nunique() < 20
            
            col_info = {
                'dtype': dtype,
                'is_numeric': is_numeric,
                'is_categorical': is_categorical,
                'unique_values': int(df[col].nunique()),
                'null_count': int(df[col].isnull().sum()),
                'outlier_count': 0
            }
            
            # Calculate outliers if numeric
            if is_numeric and len(df) > 0:
                try:
                    q1 = df[col].quantile(0.25)
                    q3 = df[col].quantile(0.75)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
                    col_info['outlier_count'] = int(len(outliers))
                except Exception:
                    pass
                    
            schema[col] = col_info
        
        return schema


# Default processor instance
_processor = None

def get_processor() -> DataProcessor:
    """Get or create default processor."""
    global _processor
    if _processor is None:
        _processor = DataProcessor()
    return _processor
