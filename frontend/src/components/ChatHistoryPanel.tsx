"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Clock,
  Search,
  RotateCcw,
  TrendingUp,
  BarChart2,
  PieChart,
  LineChart,
  Trash2,
  Calendar,
  ChevronDown,
  Zap,
} from "lucide-react";
import { ChatHistoryEntry } from "@/lib/firestore";

interface ChatHistoryPanelProps {
  userId: string | null;
  entries: ChatHistoryEntry[];
  onReplay: (query: string) => void;
  onClear?: () => void;
}

const CHART_ICON_MAP: Record<string, React.ReactNode> = {
  bar: <BarChart2 size={11} />,
  line: <LineChart size={11} />,
  pie: <PieChart size={11} />,
  area: <TrendingUp size={11} />,
};

function groupByDate(entries: ChatHistoryEntry[]) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, ChatHistoryEntry[]> = {};

  entries.forEach((e) => {
    const d = e.timestamp
      ? new Date(
          (e.timestamp as any)?.seconds
            ? (e.timestamp as any).seconds * 1000
            : e.timestamp as any
        ).toDateString()
      : "Unknown";

    let label =
      d === today ? "Today" : d === yesterday ? "Yesterday" : d;
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });

  return groups;
}

export default function ChatHistoryPanel({
  userId,
  entries,
  onReplay,
  onClear,
}: ChatHistoryPanelProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = entries.filter((e) =>
    e.query.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = groupByDate(filtered);
  const groupKeys = Object.keys(grouped);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(217,107,67,0.1)" }}
        >
          <MessageSquare size={28} style={{ color: "#D96B43" }} />
        </div>
        <p className="text-sm font-bold" style={{ color: "#2C2523" }}>
          Sign in to view chat history
        </p>
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
          Your past queries are saved automatically when you&apos;re logged in.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "#E5DFD7" }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{ background: "white", borderColor: "#E5DFD7" }}
        >
          <Search size={13} style={{ color: "rgba(0,0,0,0.35)" }} />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs outline-none bg-transparent"
            style={{ color: "#2C2523" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ color: "rgba(0,0,0,0.3)" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <Clock size={24} style={{ color: "rgba(0,0,0,0.2)" }} />
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              {search ? "No queries match your search" : "No history yet. Run your first query!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupKeys.map((label) => (
              <div key={label}>
                {/* Date group header */}
                <button
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [label]: !c[label] }))
                  }
                  className="flex items-center gap-2 w-full mb-1.5 py-1"
                >
                  <Calendar size={10} style={{ color: "rgba(0,0,0,0.35)" }} />
                  <span
                    className="text-[10px] uppercase tracking-widest font-bold"
                    style={{ color: "rgba(0,0,0,0.4)" }}
                  >
                    {label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "#E5DFD7" }} />
                  <ChevronDown
                    size={10}
                    style={{
                      color: "rgba(0,0,0,0.3)",
                      transform: collapsed[label] ? "rotate(-90deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>

                {!collapsed[label] && (
                  <div className="space-y-1.5">
                    {grouped[label].map((entry, i) => (
                      <button
                        key={entry.id || i}
                        onClick={() => onReplay(entry.query)}
                        className="w-full text-left rounded-xl border p-3 transition-all group"
                        style={{
                          background: "rgba(255,255,255,0.6)",
                          borderColor: "#E5DFD7",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "white";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#D96B43";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.6)";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "#E5DFD7";
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className="text-xs font-semibold leading-snug flex-1 truncate"
                            style={{ color: "#2C2523" }}
                          >
                            {entry.query}
                          </p>
                          <RotateCcw
                            size={11}
                            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#D96B43" }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.chartType && (
                            <span
                              className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                              style={{
                                background: "rgba(217,107,67,0.08)",
                                color: "#D96B43",
                              }}
                            >
                              {CHART_ICON_MAP[entry.chartType] || (
                                <BarChart2 size={10} />
                              )}
                              {entry.chartType}
                            </span>
                          )}
                          <span
                            className="text-[10px]"
                            style={{ color: "rgba(0,0,0,0.35)" }}
                          >
                            {entry.summary
                              ? entry.summary.slice(0, 40) + "..."
                              : "No summary"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {entries.length > 0 && onClear && (
        <div className="px-4 py-3 border-t" style={{ borderColor: "#E5DFD7" }}>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-[10px] font-semibold transition-colors"
            style={{ color: "rgba(0,0,0,0.3)" }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "#ef4444")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "rgba(0,0,0,0.3)")
            }
          >
            <Trash2 size={10} />
            Clear local history
          </button>
        </div>
      )}
    </div>
  );
}
