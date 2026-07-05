"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface QuerySuggestionsProps {
  partialQuery: string;
  schemaInfo?: any;
  filePath?: string | null;
  onSelect: (suggestion: string) => void;
}

export default function QuerySuggestions({
  partialQuery,
  schemaInfo,
  filePath,
  onSelect,
}: QuerySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuery = useRef("");

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 4 || q === lastQuery.current) return;
    lastQuery.current = q;
    setLoading(true);
    try {
      const results = await api.getQuerySuggestions(q, schemaInfo, filePath);
      if (results.length > 0) {
        setSuggestions(results);
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, [schemaInfo, filePath]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (partialQuery.length < 4) {
      setSuggestions([]);
      setVisible(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      fetchSuggestions(partialQuery);
    }, 650);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [partialQuery, fetchSuggestions]);

  if (!visible && !loading) return null;

  return (
    <div
      style={{
        marginTop: "6px",
        padding: "10px",
        borderRadius: "14px",
        border: "1.5px solid #E5DFD7",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
        }}
      >
        <Sparkles size={11} style={{ color: "#D96B43" }} />
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(0,0,0,0.4)",
          }}
        >
          {loading ? "Thinking..." : "AI Suggestions"}
        </span>
        {loading && (
          <Loader2
            size={10}
            style={{ color: "#D96B43", animation: "spin 1s linear infinite" }}
          />
        )}
      </div>

      {/* Chips */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(s);
                setVisible(false);
              }}
              style={{
                textAlign: "left",
                padding: "7px 10px",
                borderRadius: "10px",
                border: "1px solid #E5DFD7",
                background: "white",
                fontSize: "11px",
                fontWeight: 600,
                color: "#2C2523",
                cursor: "pointer",
                transition: "all 0.15s",
                lineHeight: "1.4",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(217,107,67,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "#D96B43";
                (e.currentTarget as HTMLElement).style.color = "#D96B43";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "white";
                (e.currentTarget as HTMLElement).style.borderColor = "#E5DFD7";
                (e.currentTarget as HTMLElement).style.color = "#2C2523";
              }}
            >
              ↗ {s}
            </button>
          ))}
        </div>
      )}

      {/* Skeleton loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {[80, 65, 75].map((w, i) => (
            <div
              key={i}
              style={{
                height: "30px",
                borderRadius: "10px",
                background: `linear-gradient(90deg, #E5DFD7 25%, #F4F0EB 50%, #E5DFD7 75%)`,
                backgroundSize: "200% 100%",
                animation: `shimmer 1.4s ${i * 0.15}s infinite`,
                width: `${w}%`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
