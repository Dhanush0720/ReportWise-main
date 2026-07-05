"use client";

import React, { useState } from "react";
import API from "@/lib/api";

interface ReportPanelProps {
  query: string;
  filePath: string | null;
  analysisResult: any;
}

export default function ReportPanel({
  query,
  filePath,
  analysisResult,
}: ReportPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError(null);

      console.log("Generating comprehensive report...");

      const response = await API.client.post("/generate-report", {
        query,
        file_path: filePath,
        analysis_result: analysisResult,
        chart_data: analysisResult?.chart_data || {},
      });

      console.log("Report generated:", response.data);
      setReportData(response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      console.error("Report generation error:", errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const directDownload = async (path: string, fallbackName: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}${path}`);
      
      // Extract filename from Content-Disposition header
      const disposition = response.headers.get("content-disposition");
      let filename = fallbackName;
      
      if (disposition) {
        // Better regex pattern to extract filename
        const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?(.+?)(?:;|$)/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1].replace(/^["']|["']$/g, ""));
        }
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const downloadReport = (type: "html" | "json") => {
    if (type === "html" && reportData?.download_url) {
      directDownload(reportData.download_url, "report.html");
    } else if (type === "json" && reportData?.json_url) {
      directDownload(reportData.json_url, "report.json");
    }
  };

  const viewReport = () => {
    if (reportData?.download_url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      window.open(`${baseUrl}${reportData.download_url}`, "_blank");
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/40 border border-black/10 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Generate Report</h2>

      {!reportData ? (
        <div className="space-y-3">
          <p className="text-xs text-black/55 mb-4">
            Generate comprehensive business reports with in-depth analysis, statistics, trends, and recommendations.
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={generating || !filePath}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-40 disabled:hover:from-purple-500 disabled:hover:to-pink-500 text-white rounded-lg font-bold text-xs shadow transition uppercase tracking-wider"
          >
            {generating ? "Generating Report..." : "Generate Comprehensive Report"}
          </button>

          {generating && (
            <p className="text-xs text-black/55 text-center animate-pulse">
              Analyzing data and preparing report...
            </p>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {!filePath && (
            <p className="text-[10px] text-black/35 text-center mt-2">
              Upload a file and run analysis first to generate report
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-[#5E7C62]/10 border border-[#5E7C62]/20 rounded-xl">
            <p className="text-xs text-[#2c786a] font-bold text-center">
              Report generated successfully!
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={viewReport}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>View Full Report</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Open in new window</span>
            </button>

            <button
              onClick={() => downloadReport("html")}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>Download HTML Report</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Professional formatted document</span>
            </button>

            <button
              onClick={() => downloadReport("json")}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>Download JSON Report</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Structured data format</span>
            </button>
          </div>

          <button
            onClick={() => {
              setReportData(null);
              setError(null);
            }}
            className="w-full px-4 py-2 bg-black hover:bg-black/95 text-white font-bold text-xs rounded-full shadow transition mt-4"
          >
            Generate Another Report
          </button>

          {reportData?.report?.sections && (
            <div className="mt-4 p-3 bg-black/05 rounded-xl text-xs text-black/60">
              <p className="font-bold mb-2 uppercase tracking-wide text-[9px] text-black/40">Report Sections Included:</p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-semibold">
                <li>Executive Summary</li>
                <li>Data Overview</li>
                <li>KPIs</li>
                <li>Stats Analysis</li>
                <li>Trend Analysis</li>
                <li>Quality Report</li>
                <li>Insights</li>
                <li>Recommendations</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
