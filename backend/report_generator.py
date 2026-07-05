"""
Comprehensive Report Generator

Generates detailed business reports with:
- Executive Summary
- Data Overview
- Statistical Analysis
- Trends & Patterns
- Key Metrics
- Recommendations
- Charts & Visualizations

Outputs: HTML, PDF, JSON
"""

import logging
import json
from typing import Dict, Any, List
from datetime import datetime
import pandas as pd
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate comprehensive business reports."""
    
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_full_report(
        self,
        df: pd.DataFrame,
        query: str,
        analysis_result: Dict[str, Any],
        chart_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive report with all sections.
        
        Returns: {
            'html': '<html>...</html>',
            'json': {...},
            'filename': 'report_20240107_143022.html',
            'sections': [...]
        }
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate all report sections
        sections = {
            'executive_summary': self._generate_executive_summary(df, query),
            'data_overview': self._generate_data_overview(df),
            'statistical_analysis': self._generate_statistical_analysis(df),
            'trend_analysis': self._generate_trend_analysis(df),
            'key_metrics': self._generate_key_metrics(df),
            'data_quality': self._generate_data_quality(df),
            'insights': self._generate_insights(df, analysis_result),
            'recommendations': self._generate_recommendations(df, analysis_result),
        }
        
        # Generate HTML report
        html_content = self._generate_html_report(
            df=df,
            query=query,
            sections=sections,
            chart_data=chart_data,
            timestamp=timestamp
        )
        
        # Generate JSON report
        json_report = {
            'timestamp': timestamp,
            'query': query,
            'data_shape': {'rows': len(df), 'columns': len(df.columns)},
            'sections': sections,
            'chart_data': chart_data,
            'analysis_result': analysis_result,
        }
        
        # Save files
        html_filename = f"report_{timestamp}.html"
        json_filename = f"report_{timestamp}.json"
        
        html_path = self.output_dir / html_filename
        json_path = self.output_dir / json_filename
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_report, f, indent=2, default=str)
        
        logger.info(f"Generated report: {html_filename}")
        
        return {
            'success': True,
            'html_file': str(html_path),
            'json_file': str(json_path),
            'html_filename': html_filename,
            'json_filename': json_filename,
            'sections': sections,
            'chart_data': chart_data,
        }
    
    def _generate_executive_summary(self, df: pd.DataFrame, query: str) -> Dict[str, Any]:
        """Generate executive summary section."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        summary = {
            'title': 'Executive Summary',
            'query': query,
            'data_shape': f'{len(df)} records, {len(df.columns)} fields',
            'date_generated': datetime.now().isoformat(),
            'key_highlights': [
                f"Analyzed {len(df):,} data records",
                f"Dataset contains {len(df.columns)} dimensions",
                f"Identified {len(numeric_cols)} numeric metrics",
                f"Analysis covers {df.shape[0]} time periods or entries",
            ]
        }
        
        if numeric_cols:
            summary['top_metrics'] = {
                col: {
                    'total': float(df[col].sum()),
                    'average': float(df[col].mean()),
                    'max': float(df[col].max()),
                    'min': float(df[col].min()),
                }
                for col in numeric_cols[:5]
            }
        
        return summary
    
    def _generate_data_overview(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate data overview section."""
        return {
            'title': 'Data Overview',
            'total_records': len(df),
            'total_columns': len(df.columns),
            'column_names': list(df.columns),
            'column_types': df.dtypes.astype(str).to_dict(),
            'missing_values': {
                col: int(df[col].isnull().sum())
                for col in df.columns
            },
            'duplicate_rows': int(df.duplicated().sum()),
            'memory_usage_mb': float(df.memory_usage(deep=True).sum() / 1024**2),
            'first_rows': df.head(3).to_dict('records'),
        }
    
    def _generate_statistical_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate statistical analysis section."""
        numeric_df = df.select_dtypes(include=[np.number])
        
        stats = {}
        for col in numeric_df.columns:
            stats[col] = {
                'count': int(numeric_df[col].count()),
                'mean': float(numeric_df[col].mean()),
                'std': float(numeric_df[col].std()),
                'min': float(numeric_df[col].min()),
                '25%': float(numeric_df[col].quantile(0.25)),
                'median': float(numeric_df[col].median()),
                '75%': float(numeric_df[col].quantile(0.75)),
                'max': float(numeric_df[col].max()),
                'skewness': float(numeric_df[col].skew()),
                'kurtosis': float(numeric_df[col].kurtosis()),
            }
        
        return {
            'title': 'Statistical Analysis',
            'statistics': stats,
            'summary': f"Detailed statistical breakdown of {len(stats)} numeric columns",
        }
    
    def _generate_trend_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate trend analysis section."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        trends = {}
        if numeric_cols:
            for col in numeric_cols[:5]:  # Top 5 numeric columns
                values = df[col].fillna(0).tolist()
                if len(values) > 1:
                    trend_direction = "increasing" if values[-1] > values[0] else "decreasing"
                    trend_pct = ((values[-1] - values[0]) / abs(values[0]) * 100) if values[0] != 0 else 0
                    
                    trends[col] = {
                        'direction': trend_direction,
                        'change_percentage': float(trend_pct),
                        'start_value': float(values[0]),
                        'end_value': float(values[-1]),
                        'min_value': float(min(values)),
                        'max_value': float(max(values)),
                        'avg_value': float(np.mean(values)),
                    }
        
        return {
            'title': 'Trend Analysis',
            'trends': trends,
            'summary': f"Identified trends across {len(trends)} key metrics",
        }
    
    def _generate_key_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate key metrics section."""
        numeric_df = df.select_dtypes(include=[np.number])
        
        metrics = {
            'title': 'Key Performance Indicators (KPIs)',
            'metrics': {}
        }
        
        for col in numeric_df.columns[:10]:
            total = float(numeric_df[col].sum())
            avg = float(numeric_df[col].mean())
            growth = float(numeric_df[col].pct_change().mean() * 100) if len(numeric_df[col]) > 1 else 0
            
            metrics['metrics'][col] = {
                'total': total,
                'average': avg,
                'growth_rate': growth,
                'status': 'positive' if growth > 0 else 'negative' if growth < 0 else 'neutral',
                'icon': '📈' if growth > 0 else '📉' if growth < 0 else '➡️',
            }
        
        return metrics
    
    def _generate_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate data quality section."""
        total_cells = df.size
        missing_cells = df.isnull().sum().sum()
        quality_score = ((total_cells - missing_cells) / total_cells * 100) if total_cells > 0 else 100
        
        return {
            'title': 'Data Quality Report',
            'total_cells': int(total_cells),
            'missing_cells': int(missing_cells),
            'completeness': float(quality_score),
            'status': 'Excellent' if quality_score > 95 else 'Good' if quality_score > 85 else 'Fair',
            'duplicates': int(df.duplicated().sum()),
            'issues': [
                f"Missing values: {missing_cells} cells ({100*missing_cells/total_cells:.2f}%)",
                f"Duplicate rows: {int(df.duplicated().sum())}",
                f"Columns with missing data: {(df.isnull().sum() > 0).sum()}",
            ] if missing_cells > 0 or df.duplicated().sum() > 0 else ["Data quality is excellent"],
        }
    
    def _generate_insights(self, df: pd.DataFrame, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate insights section."""
        numeric_df = df.select_dtypes(include=[np.number])
        
        insights = []
        
        # Top performing column
        if len(numeric_df.columns) > 0:
            top_col = numeric_df.sum().idxmax()
            insights.append(f"Highest performing metric: {top_col} with total of {numeric_df[top_col].sum():,.2f}")
        
        # Variability
        if len(numeric_df.columns) > 0:
            most_variable = numeric_df.std().idxmax()
            insights.append(f"Most volatile metric: {most_variable} with std dev of {numeric_df[most_variable].std():,.2f}")
        
        # Records
        insights.append(f"Dataset spans {len(df)} records with an average value presence across {(df.notna().sum().sum() / df.size * 100):.1f}% of cells")
        
        # Growth
        if len(numeric_df.columns) > 0:
            avg_growth = numeric_df.pct_change().mean().mean()
            insights.append(f"Average growth rate across metrics: {avg_growth*100:.2f}%")
        
        return {
            'title': 'Key Insights',
            'insights': insights,
            'count': len(insights),
        }
    
    def _generate_recommendations(self, df: pd.DataFrame, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate recommendations section."""
        numeric_df = df.select_dtypes(include=[np.number])
        
        recommendations = []
        
        # Data quality recommendations
        missing_pct = (df.isnull().sum().sum() / df.size * 100)
        if missing_pct > 10:
            recommendations.append({
                'priority': 'High',
                'area': 'Data Quality',
                'recommendation': f'Address missing data ({missing_pct:.1f}% of dataset)',
                'action': 'Implement data validation and cleansing processes'
            })
        
        # Variability recommendations
        if len(numeric_df.columns) > 0:
            high_variance_cols = numeric_df.columns[numeric_df.std() > numeric_df.mean()].tolist()
            if high_variance_cols:
                recommendations.append({
                    'priority': 'Medium',
                    'area': 'Analysis',
                    'recommendation': f'High variability detected in {len(high_variance_cols)} metrics',
                    'action': 'Investigate root causes and implement stabilization measures'
                })
        
        # General recommendations
        recommendations.append({
            'priority': 'Medium',
            'area': 'Monitoring',
            'recommendation': 'Establish continuous monitoring dashboard',
            'action': 'Track KPIs in real-time for proactive decision-making'
        })
        
        recommendations.append({
            'priority': 'Low',
            'area': 'Strategy',
            'recommendation': 'Expand analysis scope',
            'action': 'Include additional data dimensions for comprehensive insights'
        })
        
        return {
            'title': 'Recommendations',
            'recommendations': recommendations,
            'count': len(recommendations),
        }
    
    def _generate_html_report(
        self,
        df: pd.DataFrame,
        query: str,
        sections: Dict[str, Any],
        chart_data: Dict[str, Any],
        timestamp: str
    ) -> str:
        """Generate comprehensive HTML report."""
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Report - {timestamp}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }}
        
        header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        
        .report-meta {{
            background: #f9f9f9;
            padding: 20px 40px;
            border-bottom: 2px solid #ddd;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }}
        
        .meta-item {{
            padding: 10px 0;
        }}
        
        .meta-item label {{
            font-weight: bold;
            color: #667eea;
            display: block;
            font-size: 0.9em;
        }}
        
        .meta-item value {{
            font-size: 1.1em;
            color: #333;
            margin-top: 5px;
        }}
        
        main {{
            padding: 40px;
        }}
        
        section {{
            margin-bottom: 40px;
            page-break-inside: avoid;
        }}
        
        section h2 {{
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.8em;
        }}
        
        section h3 {{
            color: #764ba2;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }}
        
        .highlight-box {{
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 15px 0;
            border-radius: 4px;
        }}
        
        .metric-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        
        .metric-card {{
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        
        .metric-card h4 {{
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
        }}
        
        .metric-value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }}
        
        .metric-status {{
            font-size: 0.85em;
            padding: 5px 10px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 10px;
        }}
        
        .status-positive {{
            background: #d4edda;
            color: #155724;
        }}
        
        .status-negative {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .status-neutral {{
            background: #e2e3e5;
            color: #383d41;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        
        th {{
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
        }}
        
        td {{
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }}
        
        tr:hover {{
            background: #f5f5f5;
        }}
        
        .chart-container {{
            position: relative;
            width: 100%;
            height: 400px;
            margin: 20px 0;
        }}
        
        .insight-list {{
            list-style: none;
        }}
        
        .insight-list li {{
            padding: 10px;
            margin: 10px 0;
            background: #f9f9f9;
            border-left: 4px solid #764ba2;
            border-radius: 4px;
        }}
        
        .insight-list li::before {{
            content: "✓ ";
            color: #764ba2;
            font-weight: bold;
            margin-right: 10px;
        }}
        
        .recommendation {{
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }}
        
        .recommendation-priority {{
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 10px;
        }}
        
        .priority-high {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .priority-medium {{
            background: #fff3cd;
            color: #856404;
        }}
        
        .priority-low {{
            background: #d1ecf1;
            color: #0c5460;
        }}
        
        footer {{
            background: #f9f9f9;
            padding: 20px 40px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }}
        
        @media print {{
            body {{
                background: white;
            }}
            .container {{
                box-shadow: none;
                max-width: 100%;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Comprehensive Business Report</h1>
            <p>Detailed Analysis & Insights</p>
        </header>
        
        <div class="report-meta">
            <div class="meta-item">
                <label>Generated</label>
                <value>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</value>
            </div>
            <div class="meta-item">
                <label>Query</label>
                <value>{query}</value>
            </div>
            <div class="meta-item">
                <label>Records</label>
                <value>{len(df):,}</value>
            </div>
            <div class="meta-item">
                <label>Dimensions</label>
                <value>{len(df.columns)}</value>
            </div>
        </div>
        
        <main>
            {self._render_section(sections.get('executive_summary', {}))}
            
            {self._render_section(sections.get('data_overview', {}))}
            
            {self._render_section(sections.get('key_metrics', {}))}
            
            {self._render_section(sections.get('statistical_analysis', {}))}
            
            {self._render_section(sections.get('trend_analysis', {}))}
            
            {self._render_section(sections.get('data_quality', {}))}
            
            {self._render_section(sections.get('insights', {}))}
            
            {self._render_section(sections.get('recommendations', {}))}
        </main>
        
        <footer>
            <p>This report was automatically generated by NexusAnalytics</p>
            <p>Report ID: {timestamp}</p>
        </footer>
    </div>
</body>
</html>
"""
        return html
    
    def _render_section(self, section: Dict[str, Any]) -> str:
        """Render a report section as HTML."""
        if not section:
            return ""
        
        title = section.get('title', 'Section')
        html = f"<section><h2>{title}</h2>"
        
        # Render different section types
        if 'metrics' in section:
            html += self._render_metrics(section['metrics'])
        elif 'statistics' in section:
            html += self._render_statistics(section['statistics'])
        elif 'trends' in section:
            html += self._render_trends(section['trends'])
        elif 'insights' in section:
            html += self._render_insights_list(section['insights'])
        elif 'recommendations' in section:
            html += self._render_recommendations_list(section['recommendations'])
        elif 'key_highlights' in section:
            html += self._render_highlights(section['key_highlights'])
        
        html += "</section>"
        return html
    
    def _render_metrics(self, metrics: Dict[str, Any]) -> str:
        """Render metrics as cards."""
        html = '<div class="metric-grid">'
        for name, metric in metrics.items():
            status_class = f"status-{metric.get('status', 'neutral')}"
            growth = metric.get('growth_rate', 0)
            icon = metric.get('icon', '➡️')
            
            html += f"""
            <div class="metric-card">
                <h4>{name}</h4>
                <div class="metric-value">{icon} {metric.get('average', 0):.2f}</div>
                <small>Avg: {metric.get('average', 0):.2f}</small><br>
                <small>Total: {metric.get('total', 0):.2f}</small>
                <div class="metric-status {status_class}">
                    Growth: {growth:.2f}%
                </div>
            </div>
            """
        html += '</div>'
        return html
    
    def _render_statistics(self, statistics: Dict[str, Any]) -> str:
        """Render statistics table."""
        html = '<table><thead><tr>'
        html += '<th>Metric</th><th>Mean</th><th>Std Dev</th><th>Min</th><th>Max</th>'
        html += '</tr></thead><tbody>'
        
        for col, stats in statistics.items():
            html += f"""
            <tr>
                <td><strong>{col}</strong></td>
                <td>{stats.get('mean', 0):.2f}</td>
                <td>{stats.get('std', 0):.2f}</td>
                <td>{stats.get('min', 0):.2f}</td>
                <td>{stats.get('max', 0):.2f}</td>
            </tr>
            """
        
        html += '</tbody></table>'
        return html
    
    def _render_trends(self, trends: Dict[str, Any]) -> str:
        """Render trends."""
        html = ''
        for col, trend in trends.items():
            direction = trend.get('direction', 'stable')
            change = trend.get('change_percentage', 0)
            icon = '📈' if change > 0 else '📉' if change < 0 else '➡️'
            
            html += f"""
            <div class="highlight-box">
                <h3>{icon} {col}</h3>
                <p><strong>Trend:</strong> {direction.capitalize()}</p>
                <p><strong>Change:</strong> {change:.2f}%</p>
                <p><strong>Range:</strong> {trend.get('min_value', 0):.2f} to {trend.get('max_value', 0):.2f}</p>
            </div>
            """
        
        return html
    
    def _render_insights_list(self, insights: List[str]) -> str:
        """Render insights list."""
        html = '<ul class="insight-list">'
        for insight in insights:
            html += f'<li>{insight}</li>'
        html += '</ul>'
        return html
    
    def _render_recommendations_list(self, recommendations: List[Dict[str, str]]) -> str:
        """Render recommendations."""
        html = ''
        for rec in recommendations:
            priority = rec.get('priority', 'Low').lower()
            html += f"""
            <div class="recommendation">
                <span class="recommendation-priority priority-{priority}">{rec.get('priority')}</span>
                <strong>{rec.get('recommendation')}</strong>
                <p style="margin-top: 10px; font-size: 0.95em;">{rec.get('action')}</p>
            </div>
            """
        return html
    
    def _render_highlights(self, highlights: List[str]) -> str:
        """Render highlights."""
        html = '<ul class="insight-list">'
        for highlight in highlights:
            html += f'<li>{highlight}</li>'
        html += '</ul>'
        return html


# Default generator instance
_generator = None

def get_report_generator() -> ReportGenerator:
    """Get or create default report generator."""
    global _generator
    if _generator is None:
        _generator = ReportGenerator()
    return _generator
