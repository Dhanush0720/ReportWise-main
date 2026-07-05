"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { saveChatHistory, incrementProfileStat } from "@/lib/firestore";
import QuerySuggestions from "@/components/QuerySuggestions";
import api from "@/lib/api";

interface ChatInterfaceProps {
  filePath: string | null;
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any) => void;
  onLogsUpdate: (logs: any[]) => void;
  schemaInfo?: any;
}

const CHART_TYPES = [
  { id: "bar", label: "Bar Chart" },
  { id: "line", label: "Line Chart" },
  { id: "pie", label: "Pie Chart" },
  { id: "area", label: "Area Chart" },
  { id: "scatter", label: "Scatter Plot" },
  { id: "radar", label: "Radar Chart" },
  { id: "heatmap", label: "Heatmap" },
  { id: "histogram", label: "Histogram" },
];

export default function ChatInterface({
  filePath,
  onAnalysisStart,
  onAnalysisComplete,
  onLogsUpdate,
  schemaInfo,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState("bar");
  const [showChartSelector, setShowChartSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const submittedQuery = query;

    setLoading(true);
    onAnalysisStart();

    try {
      const logs: any[] = [];
      api.connectWebSocket((log) => {
        logs.push(log);
        onLogsUpdate([...logs]);
      });

      const response = await api.analyze(submittedQuery, filePath || undefined);
      const result = {
        ...response,
        preferredChartType: selectedChart,
      };
      onAnalysisComplete(result);

      logs.push({
        agent: "System",
        message: `Analysis complete! Displaying as ${selectedChart} chart.`,
        timestamp: Date.now(),
      });
      onLogsUpdate([...logs]);

      // Save to Firestore if user is logged in
      if (user) {
        saveChatHistory(user.uid, {
          query: submittedQuery,
          summary: result.result?.summary || "",
          chartType: selectedChart,
          filePath,
          success: !!result.success,
        });
        incrementProfileStat(user.uid, "analysesRun");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      onLogsUpdate([
        {
          agent: "Error",
          message: `Failed: ${(error as any).message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div
      className="backdrop-blur-md border rounded-2xl p-6 shadow-sm"
      style={{ background: "rgba(255,255,255,0.4)", borderColor: "rgba(0,0,0,0.1)" }}
    >
      <h2 className="text-xl font-bold mb-4" style={{ color: "#1a1a1a" }}>Query</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your data question... e.g., 'Find the worst-performing product last quarter'"
            disabled={loading}
            className="w-full h-24 p-3 border rounded-xl text-xs font-semibold focus:outline-none resize-none transition-all"
            style={{
              background: "rgba(255,255,255,0.6)",
              borderColor: "rgba(0,0,0,0.1)",
              color: "#1a1a1a",
              fontFamily: "inherit",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#D96B43")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
          />

          {/* Live Query Suggestions */}
          <QuerySuggestions
            partialQuery={query}
            schemaInfo={schemaInfo}
            filePath={filePath}
            onSelect={(s) => setQuery(s)}
          />
        </div>

        {/* Visualization Type Selector */}
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.05)" }}>
          <button
            type="button"
            onClick={() => setShowChartSelector(!showChartSelector)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border shadow-sm text-xs font-bold transition"
            style={{
              background: "rgba(255,255,255,0.6)",
              borderColor: "rgba(0,0,0,0.08)",
              color: "#1a1a1a",
            }}
          >
            <span>Chart Type: {CHART_TYPES.find((c) => c.id === selectedChart)?.label || selectedChart}</span>
            <span style={{ color: "rgba(0,0,0,0.45)" }}>{showChartSelector ? "▼" : "▶"}</span>
          </button>

          {showChartSelector && (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {CHART_TYPES.map((chart) => (
                <button
                  key={chart.id}
                  type="button"
                  onClick={() => {
                    setSelectedChart(chart.id);
                    setShowChartSelector(false);
                  }}
                  className="p-2 rounded-lg transition text-xs font-bold"
                  style={{
                    background:
                      selectedChart === chart.id
                        ? "#D96B43"
                        : "rgba(255,255,255,0.5)",
                    color: selectedChart === chart.id ? "white" : "rgba(0,0,0,0.6)",
                    border: `1px solid ${selectedChart === chart.id ? "#D96B43" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  {chart.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full py-2.5 font-bold text-xs rounded-full transition uppercase tracking-wider shadow-md"
          style={{
            background: loading || !query.trim() ? "rgba(0,0,0,0.15)" : "#1a1a1a",
            color: loading || !query.trim() ? "rgba(0,0,0,0.35)" : "white",
            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Analyze Data"}
        </button>
      </form>

      {loading && (
        <div
          className="mt-4 p-3 rounded-xl text-xs font-semibold animate-pulse"
          style={{
            background: "rgba(217,107,67,0.1)",
            border: "1px solid rgba(217,107,67,0.2)",
            color: "#8B3E2F",
          }}
        >
          Orchestrating AI workforce in code sandbox...
        </div>
      )}
    </div>
  );
}
