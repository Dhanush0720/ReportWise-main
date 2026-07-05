"""
Data Export Handler

Exports analysis results to:
- Tableau (.tde, .hyper)
- Power BI (CSV, JSON)
- Excel with formatting
- PDF reports
- JSON for integration APIs

Provides Tableau and Power BI compatible formats.
"""

import os
import io
import json
import logging
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional

import pandas as pd

logger = logging.getLogger(__name__)


class ExportHandler:
    """Handle data exports to various BI platforms."""
    
    def __init__(self, export_dir: str = "exports"):
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)
    
    def export_to_csv(self, df: pd.DataFrame, filename: str = "export.csv") -> Path:
        """Export DataFrame to CSV."""
        try:
            file_path = self.export_dir / filename
            df.to_csv(file_path, index=False)
            logger.info(f"Exported CSV: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"CSV export error: {str(e)}")
            raise
    
    def export_to_excel(
        self, 
        df: pd.DataFrame, 
        filename: str = "export.xlsx",
        include_summary: bool = True,
        summary_data: Optional[Dict[str, Any]] = None
    ) -> Path:
        """Export DataFrame to Excel with formatting."""
        try:
            file_path = self.export_dir / filename
            
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                # Data sheet
                df.to_excel(writer, sheet_name='Data', index=False)
                
                # Summary sheet
                if include_summary and summary_data:
                    summary_df = pd.DataFrame([summary_data])
                    summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
                # Format columns
                workbook = writer.book
                worksheet = writer.sheets['Data']
                
                for idx, col in enumerate(df.columns, 1):
                    max_length = max(
                        df[col].astype(str).map(len).max(),
                        len(col)
                    )
                    worksheet.column_dimensions[chr(64 + idx)].width = min(max_length + 2, 50)
            
            logger.info(f"Exported Excel: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Excel export error: {str(e)}")
            raise
    
    def export_to_json(self, df: pd.DataFrame, filename: str = "export.json") -> Path:
        """Export DataFrame to JSON (Power BI compatible)."""
        try:
            file_path = self.export_dir / filename
            
            # Convert to records format (good for Power BI)
            data = {
                'data': df.to_dict('records'),
                'metadata': {
                    'row_count': len(df),
                    'column_count': len(df.columns),
                    'columns': list(df.columns),
                    'dtypes': df.dtypes.astype(str).to_dict(),
                }
            }
            
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            logger.info(f"Exported JSON: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"JSON export error: {str(e)}")
            raise
    
    def export_for_tableau(self, df: pd.DataFrame, filename: str = "export.csv") -> Path:
        """
        Export in Tableau-compatible format (CSV with UTF-8 encoding).
        
        Tableau can import CSV files directly.
        Provides flat structure suitable for Tableau's data model.
        """
        try:
            # Tableau prefers UTF-8 CSV
            file_path = self.export_dir / filename
            df.to_csv(file_path, index=False, encoding='utf-8')
            
            # Create metadata for Tableau
            metadata = {
                'export_format': 'csv_for_tableau',
                'row_count': len(df),
                'column_count': len(df.columns),
                'columns': list(df.columns),
                'data_types': df.dtypes.astype(str).to_dict(),
                'suggested_tableau_sheet': 'Sheet1',
                'instructions': 'Import this CSV into Tableau as a new data source'
            }
            
            # Save metadata alongside CSV
            metadata_path = file_path.with_suffix('.tableau.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Exported for Tableau: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Tableau export error: {str(e)}")
            raise
    
    def export_for_powerbi(self, df: pd.DataFrame, filename: str = "export.json") -> Path:
        """
        Export in Power BI-compatible JSON format.
        
        Power BI can import JSON with specific structure.
        Includes metadata for Power BI data model.
        """
        try:
            file_path = self.export_dir / filename
            
            # Power BI compatible structure
            export_data = {
                'source': 'NexusAnalytics',
                'version': '1.0',
                'data': df.to_dict('records'),
                'schema': {
                    'fields': [
                        {
                            'name': col,
                            'type': str(df[col].dtype),
                            'nullable': bool(df[col].isnull().any())
                        }
                        for col in df.columns
                    ]
                },
                'stats': {
                    'row_count': len(df),
                    'column_count': len(df.columns),
                    'null_rows': df.isnull().any(axis=1).sum()
                }
            }
            
            with open(file_path, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            logger.info(f"Exported for Power BI: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Power BI export error: {str(e)}")
            raise
    
    def export_analysis_report(
        self,
        df: pd.DataFrame,
        analysis_result: Dict[str, Any],
        chart_data: Dict[str, Any],
        filename_base: str = "analysis_report"
    ) -> Dict[str, Path]:
        """
        Export complete analysis with multiple formats.
        
        Returns paths to all exported files.
        """
        exports = {}
        
        try:
            # CSV for Tableau
            tableau_file = filename_base + "_tableau.csv"
            exports['tableau'] = self.export_for_tableau(df, tableau_file)
            
            # JSON for Power BI
            powerbi_file = filename_base + "_powerbi.json"
            exports['powerbi'] = self.export_for_powerbi(df, powerbi_file)
            
            # Excel with summary
            excel_file = filename_base + ".xlsx"
            summary = {
                'query': analysis_result.get('query', 'N/A'),
                'row_count': len(df),
                'column_count': len(df.columns),
                'export_timestamp': pd.Timestamp.now().isoformat(),
            }
            exports['excel'] = self.export_to_excel(df, excel_file, include_summary=True, summary_data=summary)
            
            # JSON export
            json_file = filename_base + ".json"
            exports['json'] = self.export_to_json(df, json_file)
            
            # Chart data export
            if chart_data:
                chart_file = filename_base + "_chart.json"
                chart_path = self.export_dir / chart_file
                with open(chart_path, 'w') as f:
                    json.dump(chart_data, f, indent=2)
                exports['chart'] = chart_path
            
            logger.info(f"Exported complete analysis report with {len(exports)} files")
            return exports
        
        except Exception as e:
            logger.error(f"Analysis report export error: {str(e)}")
            raise
    
    def get_export_info(self) -> Dict[str, Any]:
        """Get information about available exports."""
        exports = list(self.export_dir.glob('*'))
        
        return {
            'export_directory': str(self.export_dir),
            'total_exports': len(exports),
            'recent_exports': [
                {
                    'filename': f.name,
                    'size_kb': f.stat().st_size / 1024,
                    'modified': pd.Timestamp(f.stat().st_mtime).isoformat()
                }
                for f in sorted(exports, key=lambda x: x.stat().st_mtime, reverse=True)[:10]
            ]
        }


# Default handler instance
_handler = None

def get_export_handler() -> ExportHandler:
    """Get or create default export handler."""
    global _handler
    if _handler is None:
        _handler = ExportHandler()
    return _handler
