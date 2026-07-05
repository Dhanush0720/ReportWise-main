"use client";

import React, { useState } from "react";
import API from "@/lib/api";

interface ExportPanelProps {
  query: string;
  filePath: string | null;
  analysisResult: any;
}

export default function ExportPanel({
  query,
  filePath,
  analysisResult,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [exports, setExports] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: "tableau" | "powerbi" | "all") => {
    try {
      setExporting(true);
      setError(null);

      console.log(`Exporting to ${format}...`);

      const response = await API.client.post("/export", {
        query,
        file_path: filePath,
        format,
        analysis_result: analysisResult,
      });

      setExports(response.data.exports);
      console.log("Export successful:", response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      console.error("Export error:", errorMsg);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = async (url: string, fallbackName: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}${url}`);

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

  return (
    <div className="backdrop-blur-md bg-white/40 border border-black/10 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Export Results</h2>

      {!exports ? (
        <div className="space-y-3">
          <p className="text-xs text-black/55 mb-4">
            Export your analysis to Tableau, Power BI, or other formats.
          </p>

          <button
            onClick={() => handleExport("tableau")}
            disabled={exporting || !filePath}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white rounded-lg font-bold text-xs shadow transition uppercase tracking-wider"
          >
            Export for Tableau
          </button>

          <button
            onClick={() => handleExport("powerbi")}
            disabled={exporting || !filePath}
            className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 disabled:hover:bg-yellow-500 text-white rounded-lg font-bold text-xs shadow transition uppercase tracking-wider"
          >
            Export for Power BI
          </button>

          <button
            onClick={() => handleExport("all")}
            disabled={exporting || !filePath}
            className="w-full px-4 py-2 bg-black hover:bg-black/95 disabled:opacity-40 disabled:hover:bg-black text-white rounded-lg font-bold text-xs shadow transition uppercase tracking-wider"
          >
            Export All Formats
          </button>

          {exporting && (
            <p className="text-xs text-black/55 text-center animate-pulse">Exporting data...</p>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {!filePath && (
            <p className="text-[10px] text-black/35 text-center mt-2">
              Upload a file first to enable export
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#2c786a] font-bold mb-4">Export complete!</p>

          {exports.tableau && (
            <button
              onClick={() => downloadFile(exports.tableau.url, "tableau_export.csv")}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>{exports.tableau.format}</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Click to download file</span>
            </button>
          )}

          {exports.powerbi && (
            <button
              onClick={() => downloadFile(exports.powerbi.url, "powerbi_export.json")}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>{exports.powerbi.format}</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Click to download file</span>
            </button>
          )}

          {exports.excel && (
            <button
              onClick={() => downloadFile(exports.excel.url, "data_export.xlsx")}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>{exports.excel.format}</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Click to download sheet</span>
            </button>
          )}

          {exports.json && (
            <button
              onClick={() => downloadFile(exports.json.url, "data_export.json")}
              className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
            >
              <span>{exports.json.format}</span>
              <br />
              <span className="text-[10px] text-black/45 font-medium">Click to download json</span>
            </button>
          )}

          <button
            onClick={() => setExports(null)}
            className="w-full px-4 py-2 bg-black hover:bg-black/95 text-white font-bold text-xs rounded-full shadow transition mt-4"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
