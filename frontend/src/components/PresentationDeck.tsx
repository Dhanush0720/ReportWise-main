"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Palette,
  X,
  Printer,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import API from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { incrementProfileStat } from "@/lib/firestore";

// ─── Themes ──────────────────────────────────────────────────────────────────

const THEMES = {
  terracotta: {
    name: "Terracotta",
    bg: "linear-gradient(135deg, #EDE8DC 0%, #E8D5C4 100%)",
    accent: "#D96B43",
    accentLight: "rgba(217,107,67,0.12)",
    text: "#2C2523",
    subtitle: "rgba(44,37,35,0.55)",
    card: "rgba(255,255,255,0.7)",
    bar: "rgba(0,0,0,0.5)",
    chartColor: "#D96B43",
  },
  midnight: {
    name: "Midnight",
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    accent: "#7B9BE0",
    accentLight: "rgba(123,155,224,0.15)",
    text: "#E8E8F0",
    subtitle: "rgba(232,232,240,0.55)",
    card: "rgba(255,255,255,0.08)",
    bar: "rgba(255,255,255,0.15)",
    chartColor: "#7B9BE0",
  },
  forest: {
    name: "Forest",
    bg: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)",
    accent: "#5CC8B5",
    accentLight: "rgba(92,200,181,0.15)",
    text: "#E8F0E8",
    subtitle: "rgba(232,240,232,0.55)",
    card: "rgba(255,255,255,0.08)",
    bar: "rgba(255,255,255,0.12)",
    chartColor: "#5CC8B5",
  },
  slate: {
    name: "Slate",
    bg: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
    accent: "#F0A855",
    accentLight: "rgba(240,168,85,0.15)",
    text: "#E2E8F0",
    subtitle: "rgba(226,232,240,0.55)",
    card: "rgba(255,255,255,0.07)",
    bar: "rgba(255,255,255,0.12)",
    chartColor: "#F0A855",
  },
  sand: {
    name: "Sand",
    bg: "linear-gradient(135deg, #F4F0EB 0%, #E8DDD0 100%)",
    accent: "#C89E7A",
    accentLight: "rgba(200,158,122,0.12)",
    text: "#3D3128",
    subtitle: "rgba(61,49,40,0.5)",
    card: "rgba(255,255,255,0.65)",
    bar: "rgba(0,0,0,0.5)",
    chartColor: "#C89E7A",
  },
  purple: {
    name: "Amethyst",
    bg: "linear-gradient(135deg, #2d1b69 0%, #1a0a3c 100%)",
    accent: "#a855f7",
    accentLight: "rgba(168,85,247,0.15)",
    text: "#EDE9F6",
    subtitle: "rgba(237,233,246,0.55)",
    card: "rgba(255,255,255,0.07)",
    bar: "rgba(255,255,255,0.12)",
    chartColor: "#a855f7",
  },
};

type ThemeKey = keyof typeof THEMES;

const CHART_COLORS = ["#5CC8B5", "#F0A855", "#7B9BE0", "#C8E234", "#E8762D", "#e879f9"];

// ─── Component ────────────────────────────────────────────────────────────────

interface PresentationDeckProps {
  query: string;
  filePath: string | null;
  analysisResult: any;
}

export default function PresentationDeck({
  query,
  filePath,
  analysisResult,
}: PresentationDeckProps) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [deckData, setDeckData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("terracotta");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const theme = THEMES[selectedTheme];

  // Keyboard navigation
  useEffect(() => {
    if (!deckData) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        setCurrentSlide((s) => Math.min(deckData.total_slides - 1, s + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        setCurrentSlide((s) => Math.max(0, s - 1));
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deckData, isFullscreen]);

  const handleGenerateDeck = async (usePrompt = false) => {
    try {
      setGenerating(true);
      setError(null);
      if (!filePath) { setError("Please upload a file first"); setGenerating(false); return; }
      if (usePrompt && !customPrompt.trim()) { setError("Please enter a custom prompt"); setGenerating(false); return; }

      const response = await API.client.post("/generate-deck", {
        query: usePrompt ? customPrompt : query || "Data Analysis",
        file_path: filePath,
        analysis_result: analysisResult || {},
        chart_data: analysisResult?.result?.chart_data || {},
      });

      setDeckData(response.data.deck);
      setCurrentSlide(0);
      setShowPromptInput(false);
      setCustomPrompt("");
      setIsFullscreen(true);

      if (user) incrementProfileStat(user.uid, "decksCreated");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const slide = deckData?.slides?.[currentSlide];

  const renderSlideContent = () => {
    if (!slide) return null;
    const content = slide.content || {};

    const cardStyle: React.CSSProperties = {
      background: theme.card,
      borderRadius: "12px",
      padding: "16px",
      backdropFilter: "blur(6px)",
    };

    switch (slide.type) {
      case "executive_summary":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
              {content.kpis?.map((kpi: any, idx: number) => (
                <div key={idx} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.subtitle, marginBottom: "8px" }}>
                    {kpi.metric}
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: theme.accent }}>
                    {typeof kpi.value === "number" ? (kpi.value > 10000 ? `${(kpi.value / 1000).toFixed(0)}k` : kpi.value.toFixed(0)) : kpi.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {content.key_findings?.map((f: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: theme.accent, fontWeight: 900, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: "13px", color: theme.text, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "data_overview":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
              {[
                { label: "Total Records", value: content.total_records?.toLocaleString() },
                { label: "Completeness", value: `${content.data_quality?.completeness?.toFixed(1)}%` },
                { label: "Dimensions", value: content.total_columns },
              ].map(({ label, value }, i) => (
                <div key={i} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: theme.subtitle, textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: theme.accent }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={cardStyle}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: theme.text, marginBottom: "10px" }}>Quality Metrics</div>
                {content.quality_metrics?.map((m: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: theme.subtitle, marginBottom: "4px" }}>
                    <span style={{ color: theme.accent }}>•</span>{m}
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: theme.text, marginBottom: "10px" }}>Column Summary</div>
                <div style={{ fontSize: "11px", color: theme.subtitle, marginBottom: "6px" }}>
                  <strong style={{ color: theme.text }}>Numeric:</strong> {content.column_summary?.numeric?.join(", ")}
                </div>
                <div style={{ fontSize: "11px", color: theme.subtitle }}>
                  <strong style={{ color: theme.text }}>Categorical:</strong> {content.column_summary?.categorical?.join(", ")}
                </div>
              </div>
            </div>
          </div>
        );

      case "top_performers":
      case "bottom_performers":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={content.top_performers?.map((p: any) => ({ name: p.name?.slice(0, 12), value: p.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.accent}30`} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.subtitle }} />
                <YAxis tick={{ fontSize: 11, fill: theme.subtitle }} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px", color: "white" }} />
                <Bar dataKey="value" fill={theme.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {content.insights?.map((ins: string, i: number) => (
                <div key={i} style={{ ...cardStyle, fontSize: "11px", color: theme.subtitle }}>
                  <span style={{ color: theme.accent }}>• </span>{ins}
                </div>
              ))}
            </div>
          </div>
        );

      case "trend_analysis":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ ...cardStyle, textAlign: "center" }}>
              <div style={{ fontSize: "40px", fontWeight: 900, color: theme.accent }}>{content.trend_direction}</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: theme.text }}>
                {content.trend_percentage > 0 ? "+" : ""}{content.trend_percentage?.toFixed(1)}%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={content.data_points?.map((v: number, i: number) => ({ name: i, value: v }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.accent}25`} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.subtitle }} />
                <YAxis tick={{ fontSize: 10, fill: theme.subtitle }} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px", color: "white" }} />
                <Line type="monotone" dataKey="value" stroke={theme.accent} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "statistical_analysis":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
              {[
                { label: "Mean", value: content.statistics?.mean },
                { label: "Median", value: content.statistics?.median },
                { label: "Std Dev", value: content.statistics?.std_dev },
                { label: "Range", value: `${content.statistics?.min?.toFixed(0)}–${content.statistics?.max?.toFixed(0)}` },
              ].map(({ label, value }, i) => (
                <div key={i} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: theme.subtitle, textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: theme.accent }}>
                    {typeof value === "number" ? value.toFixed(1) : value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {content.insights?.map((ins: string, i: number) => (
                <div key={i} style={{ ...cardStyle, display: "flex", gap: "8px" }}>
                  <span style={{ color: theme.accent, fontWeight: 900 }}>•</span>
                  <span style={{ fontSize: "12px", color: theme.subtitle }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "recommendations":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {content.recommendations?.map((rec: string, i: number) => (
              <div key={i} style={{ ...cardStyle, display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "22px", flexShrink: 0 }}>{["🎯", "📈", "🔍", "⚡", "💡"][i % 5]}</span>
                <span style={{ fontSize: "13px", color: theme.text, lineHeight: 1.5 }}>{rec}</span>
              </div>
            ))}
            {content.next_steps && (
              <div style={{ ...cardStyle, border: `1px solid ${theme.accent}40`, background: theme.accentLight }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: theme.accent, marginBottom: "10px" }}>Next Steps</div>
                {content.next_steps?.map((step: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: theme.text, marginBottom: "6px" }}>
                    <span style={{ color: theme.accent, fontWeight: 700 }}>{i + 1}.</span>{step}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div style={cardStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {content.insights?.map((ins: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: "8px" }}>
                  <span style={{ color: theme.accent }}>→</span>
                  <span style={{ fontSize: "13px", color: theme.subtitle }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // ── No deck yet: generation panel ──────────────────────────────────────────

  if (!deckData) {
    return (
      <div
        className="backdrop-blur-md border rounded-2xl p-6 shadow-sm"
        style={{ background: "rgba(255,255,255,0.4)", borderColor: "rgba(0,0,0,0.1)" }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: "#1a1a1a" }}>Presentation Deck</h2>

        {/* Theme Picker */}
        <div className="mb-4">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border w-full justify-between"
            style={{ borderColor: "#E5DFD7", background: "rgba(255,255,255,0.6)", color: "#2C2523" }}
          >
            <div className="flex items-center gap-2">
              <Palette size={13} style={{ color: "#D96B43" }} />
              <span>Theme: {THEMES[selectedTheme].name}</span>
              <div
                className="w-4 h-4 rounded-full border"
                style={{ background: THEMES[selectedTheme].accent, borderColor: "rgba(0,0,0,0.1)" }}
              />
            </div>
            <span style={{ color: "rgba(0,0,0,0.4)" }}>{showThemePicker ? "▲" : "▼"}</span>
          </button>

          {showThemePicker && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setSelectedTheme(key); setShowThemePicker(false); }}
                  className="flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition-all"
                  style={{
                    borderColor: selectedTheme === key ? THEMES[key].accent : "#E5DFD7",
                    background: selectedTheme === key ? `${THEMES[key].accent}12` : "rgba(255,255,255,0.5)",
                    color: selectedTheme === key ? THEMES[key].accent : "#2C2523",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ background: THEMES[key].accent }}
                  />
                  {THEMES[key].name}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs mb-4" style={{ color: "rgba(0,0,0,0.55)" }}>
          Generate 8–10 slide presentation with AI analysis, visualizations, and metrics.
        </p>

        {!showPromptInput ? (
          <div className="space-y-3">
            <button
              onClick={() => handleGenerateDeck(false)}
              disabled={generating || !filePath}
              className="w-full py-3 font-bold text-xs rounded-lg shadow transition uppercase tracking-wider"
              style={{
                background: generating || !filePath ? "rgba(0,0,0,0.1)" : "linear-gradient(135deg, #D96B43, #764BA2)",
                color: generating || !filePath ? "rgba(0,0,0,0.35)" : "white",
                cursor: generating || !filePath ? "not-allowed" : "pointer",
              }}
            >
              {generating ? "Generating Deck..." : "✦ Generate Deck"}
            </button>
            <button
              onClick={() => setShowPromptInput(true)}
              disabled={generating || !filePath}
              className="w-full py-2.5 font-bold text-xs rounded-lg border transition"
              style={{
                border: "1.5px solid #E5DFD7",
                background: "rgba(255,255,255,0.6)",
                color: "#2C2523",
                cursor: generating || !filePath ? "not-allowed" : "pointer",
                opacity: generating || !filePath ? 0.4 : 1,
              }}
            >
              Custom Prompt →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Focus on revenue trends and regional performance..."
              rows={3}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none resize-none"
              style={{ borderColor: "#D96B43", background: "white", color: "#2C2523", fontFamily: "inherit" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateDeck(true)}
                disabled={generating || !customPrompt.trim() || !filePath}
                className="flex-1 py-2 font-bold text-xs rounded-lg text-white"
                style={{ background: "#764BA2", cursor: "pointer" }}
              >
                {generating ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={() => { setShowPromptInput(false); setCustomPrompt(""); }}
                disabled={generating}
                className="flex-1 py-2 font-bold text-xs rounded-lg border"
                style={{ border: "1.5px solid #E5DFD7", background: "white", color: "#2C2523", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}
        {!filePath && (
          <p className="text-center mt-3" style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>
            Upload a file and run analysis first
          </p>
        )}
      </div>
    );
  }

  // ── Full deck viewer ────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 100 : 1,
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        borderRadius: isFullscreen ? 0 : "16px",
        overflow: "hidden",
        height: isFullscreen ? "100vh" : "420px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "rgba(0,0,0,0.6)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ color: "white", fontSize: "16px", fontWeight: 800, margin: 0 }}>{deckData.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", margin: 0 }}>
            Slide {currentSlide + 1} of {deckData.total_slides} · Theme: {theme.name}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* Theme switcher in fullscreen */}
          {isFullscreen && (
            <div style={{ display: "flex", gap: "4px" }}>
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedTheme(k)}
                  title={THEMES[k].name}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: THEMES[k].accent,
                    border: selectedTheme === k ? "2px solid white" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => window.print()}
            style={{ padding: "6px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer" }}
            title="Print / Export PDF"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ padding: "6px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer" }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => { setDeckData(null); setCurrentSlide(0); setIsFullscreen(false); }}
            style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.2)", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* Slide canvas */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(10,10,10,0.9)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              height: "100%",
              maxHeight: "520px",
              background: theme.bg,
              borderRadius: "16px",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Slide header */}
            <div style={{ marginBottom: "28px", flexShrink: 0 }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.subtitle, margin: "0 0 6px" }}>
                {currentSlide + 1} / {deckData.total_slides}
              </p>
              <h2 style={{ fontSize: "30px", fontWeight: 900, color: theme.text, margin: 0, fontFamily: "'Figtree', sans-serif", lineHeight: 1.15 }}>
                {slide?.title}
              </h2>
              <div style={{ width: "48px", height: "3px", background: theme.accent, borderRadius: "2px", marginTop: "12px" }} />
            </div>

            {/* Slide content */}
            <div style={{ flex: 1, overflow: "auto" }}>{renderSlideContent()}</div>
          </div>
        </div>

        {/* Slide nav strip */}
        <div
          style={{
            width: "72px",
            background: "rgba(0,0,0,0.7)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "12px 8px",
            gap: "6px",
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
            disabled={currentSlide === 0}
            style={{ padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", color: currentSlide === 0 ? "rgba(255,255,255,0.2)" : "white", cursor: currentSlide === 0 ? "not-allowed" : "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>

          {deckData.slides?.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: "40px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                background: idx === currentSlide ? theme.accent : "rgba(255,255,255,0.08)",
                color: idx === currentSlide ? "white" : "rgba(255,255,255,0.45)",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentSlide((s) => Math.min(deckData.total_slides - 1, s + 1))}
            disabled={currentSlide === deckData.total_slides - 1}
            style={{ padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", color: currentSlide === deckData.total_slides - 1 ? "rgba(255,255,255,0.2)" : "white", cursor: currentSlide === deckData.total_slides - 1 ? "not-allowed" : "pointer" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "rgba(0,0,0,0.5)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: "11px",
          color: "rgba(255,255,255,0.4)",
          flexShrink: 0,
        }}
      >
        <span>← → arrow keys to navigate</span>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "11px" }}
            onClick={() => window.print()}
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
