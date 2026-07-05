import { useState, useRef } from "react";
import {
  Upload,
  Search,
  BarChart2,
  Download,
  FileBarChart,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Wifi,
  Database,
  Cpu,
  Zap,
  ArrowRight,
  Play,
  RefreshCw,
  FileText,
  Instagram,
  Music2,
  Star,
} from "lucide-react";
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

/* ─── Data ─────────────────────────────────────────────────────── */
const chartData = [
  { name: "P1", value: 82000 },
  { name: "P2", value: 51000 },
  { name: "P3", value: 95000 },
  { name: "P4", value: 34000 },
  { name: "P5", value: 78000 },
  { name: "P6", value: 62000 },
  { name: "P7", value: 110000 },
  { name: "P8", value: 45000 },
  { name: "P9", value: 89000 },
  { name: "P10", value: 73000 },
  { name: "P11", value: 58000 },
  { name: "P12", value: 101000 },
];

const logMessages = [
  { type: "ok", text: "Loading products list & queries..." },
  { type: "ok", text: "Searching session data..." },
  { type: "info", text: "Setting up analysis pipeline..." },
  { type: "ok", text: "Processing sales data..." },
  { type: "info", text: "Highlighting data to product list..." },
  { type: "ok", text: "Data analysis completed" },
  { type: "ok", text: "Job executed successfully" },
  { type: "ok", text: "2 checks passed" },
];

const vizTypes = ["Line Chart", "Bar Chart", "Area Chart", "Scatter Plot"];

const tickerItems = [
  { icon: Zap, label: "Autonomous Multi-Agent" },
  { icon: Cpu, label: "Real-time Analysis" },
  { icon: Database, label: "284K Records" },
  { icon: TrendingUp, label: "Export to Tableau" },
  { icon: Wifi, label: "Live Data Sync" },
];

const navItems = [
  {
    id: "upload",
    label: "Upload\nData",
    icon: Upload,
    bg: "#5CC8B5",
    text: "#fff",
  },
  {
    id: "query",
    label: "Query",
    icon: Search,
    bg: "#F0A855",
    text: "#fff",
  },
  {
    id: "export",
    label: "Export",
    icon: Download,
    bg: "#7B9BE0",
    text: "#fff",
  },
  {
    id: "report",
    label: "Report",
    icon: FileBarChart,
    bg: "#2C2C2C",
    text: "#fff",
  },
];

const exportOptions = [
  { label: "Export for Tableau", color: "#E8762D" },
  { label: "Export for Power BI", color: "#F2C811" },
  { label: "Export All Formats", color: "#5CC8B5" },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav] = useState<string>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [vizType, setVizType] = useState("Line Chart");
  const [vizOpen, setVizOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setActiveNav("query");
    }, 1800);
  };

  /* ─── Chart renderer ──── */
  const renderChart = () => {
    const common = {
      data: chartData,
      margin: { top: 10, right: 10, left: -16, bottom: 0 },
    };
    const axis = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px", fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
        />
      </>
    );

    if (vizType === "Bar Chart")
      return (
        <BarChart {...common}>
          {axis}
          <Bar dataKey="value" fill="#5CC8B5" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    if (vizType === "Area Chart")
      return (
        <AreaChart {...common}>
          {axis}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5CC8B5" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#5CC8B5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke="#5CC8B5" strokeWidth={2.5} fill="url(#areaGrad)" />
        </AreaChart>
      );
    return (
      <LineChart {...common}>
        {axis}
        <Line type="monotone" dataKey="value" stroke="#5CC8B5" strokeWidth={2.5} dot={{ r: 3.5, fill: "#5CC8B5", strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    );
  };

  /* ─── Center panel content ──── */
  const centerContent = () => {
    if (activeNav === "upload") {
      return (
        <>
          {/* pill */}
          <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
            Upload Data File
          </span>
          <h1 className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4" style={{ fontFamily: "'Figtree', sans-serif" }}>
            Drop your data,<br />let AI do the rest.
          </h1>
          <p className="text-sm text-black/55 leading-relaxed mb-7 max-w-xs">
            Upload any CSV, XLSX, or JSON file. Our autonomous agents will parse, analyse, and surface insights in seconds.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-6 ${isDragging ? "border-[#5CC8B5] bg-[#5CC8B5]/5" : "border-black/15 hover:border-[#5CC8B5] hover:bg-[#5CC8B5]/5"}`}
          >
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileName(f.name); }} />
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={15} className="text-[#5CC8B5]" />
                <span className="text-sm font-semibold text-[#1a1a1a] font-mono">{fileName}</span>
                <button onClick={(e) => { e.stopPropagation(); setFileName(null); }} className="text-black/30 hover:text-black/60 ml-1">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={20} className="text-black/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-black/60">Drop file here or click to browse</p>
                <p className="text-xs text-black/35 mt-1">CSV · XLSX · JSON</p>
              </>
            )}
          </div>

          {/* Analyze CTA */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 border border-black/80 rounded-full px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all disabled:opacity-50"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            {isAnalyzing ? <><RefreshCw size={14} className="animate-spin" />Analyzing...</> : <><Play size={14} />Analyze Data</>}
          </button>
        </>
      );
    }

    if (activeNav === "query") {
      return (
        <>
          <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
            Natural Language Query
          </span>
          <h1 className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4" style={{ fontFamily: "'Figtree', sans-serif" }}>
            Ask your data<br />anything.
          </h1>
          <p className="text-sm text-black/55 leading-relaxed mb-6 max-w-xs">
            Type a plain-English question and our AI will translate it into an analysis and visualisation.
          </p>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Find the worst-performing products in Q3..."
            className="w-full rounded-2xl border border-black/15 bg-white/70 p-4 text-sm text-[#1a1a1a] placeholder:text-black/30 resize-none focus:outline-none focus:border-[#5CC8B5] focus:ring-2 focus:ring-[#5CC8B5]/20 transition-all mb-4"
            rows={4}
          />

          {/* Viz selector */}
          <div className="mb-6">
            <label className="text-xs font-bold text-black/50 uppercase tracking-wider mb-2 block">Visualisation type</label>
            <div className="relative">
              <button
                onClick={() => setVizOpen(!vizOpen)}
                className="w-full bg-white/70 border border-black/15 rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] flex items-center justify-between hover:border-[#5CC8B5] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 size={13} className="text-[#5CC8B5]" />
                  {vizType}
                </div>
                <ChevronDown size={13} className={`text-black/40 transition-transform ${vizOpen ? "rotate-180" : ""}`} />
              </button>
              {vizOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-black/10 rounded-xl shadow-lg z-10 overflow-hidden">
                  {vizTypes.map((v) => (
                    <button key={v} onClick={() => { setVizType(v); setVizOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0fdf9] transition-colors ${v === vizType ? "text-[#5CC8B5] font-semibold" : "text-[#374151]"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 border border-black/80 rounded-full px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all disabled:opacity-50 self-start"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            {isAnalyzing ? <><RefreshCw size={14} className="animate-spin" />Running...</> : <><Play size={14} />Run Query<ArrowRight size={13} /></>}
          </button>
        </>
      );
    }

    if (activeNav === "export") {
      return (
        <>
          <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
            Export Results
          </span>
          <h1 className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4" style={{ fontFamily: "'Figtree', sans-serif" }}>
            Share insights<br />anywhere.
          </h1>
          <p className="text-sm text-black/55 leading-relaxed mb-8 max-w-xs">
            Export your analysis to Tableau, Power BI, or download in multiple formats for any workflow.
          </p>

          <div className="space-y-3">
            {exportOptions.map((opt) => (
              <button
                key={opt.label}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-black/10 bg-white/60 hover:bg-white hover:border-black/20 transition-all text-sm font-semibold text-[#1a1a1a] group"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.color }} />
                {opt.label}
                <ArrowRight size={13} className="ml-auto text-black/30 group-hover:text-black/60 transition-colors" />
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeNav === "report") {
      return (
        <>
          <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
            Generate Report
          </span>
          <h1 className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4" style={{ fontFamily: "'Figtree', sans-serif" }}>
            Board-ready<br />reports, instantly.
          </h1>
          <p className="text-sm text-black/55 leading-relaxed mb-7 max-w-xs">
            Generate comprehensive business reports with in-depth analysis, statistics, trends, and recommendations.
          </p>

          <div className="grid grid-cols-1 gap-2.5 mb-8">
            {["Revenue trend analysis", "Product performance breakdown", "Statistical anomalies detected", "Actionable recommendations"].map((item) => (
              <div key={item} className="flex items-center gap-2.5 bg-white/60 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={13} className="text-[#5CC8B5] shrink-0" />
                <span className="text-xs font-medium text-black/70">{item}</span>
              </div>
            ))}
          </div>

          <button
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-black/80 transition-all self-start"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            <FileBarChart size={14} />
            Generate Comprehensive Report
            <ArrowRight size={13} />
          </button>
        </>
      );
    }
  };

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif", background: "#EDE8DC" }}>

      {/* Ticker bar */}
      <div className="w-full border-b border-black/10 flex items-center shrink-0" style={{ height: "36px" }}>
        <div className="flex items-center justify-around w-full px-4">
          {tickerItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              {i > 0 && <Star size={8} className="text-black/25 fill-black/25" />}
              <item.icon size={12} className="text-black/50" />
              <span className="text-xs font-medium text-black/60 tracking-wide">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="flex flex-col shrink-0 border-r border-black/10" style={{ width: "80px" }}>
          {/* Logo */}
          <div className="px-3 py-3 border-b border-black/10 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-[#5CC8B5] flex items-center justify-center">
              <BarChart2 size={11} className="text-white" />
            </div>
            <span className="text-[13px] font-black tracking-tight" style={{ fontFamily: "'Figtree', sans-serif", color: "#1a1a1a" }}>
              nexus.
            </span>
          </div>

          {/* Nav blocks */}
          <div className="flex flex-col flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="flex-1 flex flex-col justify-between p-2.5 border-b border-black/10 text-left transition-all"
                style={{ background: activeNav === item.id ? item.bg : `${item.bg}cc` }}
              >
                <item.icon size={13} style={{ color: item.text, opacity: 0.85 }} />
                <span className="text-[10px] font-bold leading-tight whitespace-pre-line" style={{ color: item.text, fontFamily: "'Figtree', sans-serif" }}>
                  {item.label}
                </span>
              </button>
            ))}

            {/* Results block — always lime */}
            <button
              onClick={() => setActiveNav("results")}
              className="flex flex-col justify-between p-2.5 text-left transition-all"
              style={{ background: activeNav === "results" ? "#C8E234" : "#C8E234cc", minHeight: "68px" }}
            >
              <TrendingUp size={13} style={{ color: "#1a1a1a", opacity: 0.7 }} />
              <span className="text-[10px] font-black leading-tight" style={{ color: "#1a1a1a", fontFamily: "'Figtree', sans-serif" }}>
                Results
              </span>
            </button>
          </div>

          {/* Bottom */}
          <div className="p-3 border-t border-black/10">
            <span className="text-[9px] font-semibold text-black/40 block mb-2 uppercase tracking-wider">AI</span>
            <div className="flex flex-col gap-1.5">
              <Instagram size={12} className="text-black/40 hover:text-black/70 cursor-pointer transition-colors" />
              <Music2 size={12} className="text-black/40 hover:text-black/70 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>

        {/* ── Center content ── */}
        <div className="flex flex-col justify-center px-10 py-8 overflow-y-auto shrink-0" style={{ width: "400px" }}>
          {activeNav === "results" ? (
            <>
              <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
                Analysis Results
              </span>
              <h1 className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4" style={{ fontFamily: "'Figtree', sans-serif" }}>
                Your data,<br />visualised.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-6 max-w-xs">
                Product7 leads revenue at $110,000. Average across 12 products: $73,167. Strong performance with 3 products exceeding $90k.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-7">
                {[
                  { label: "Peak Revenue", value: "$110k", sub: "Product 7" },
                  { label: "Avg Revenue", value: "$73k", sub: "12 products" },
                  { label: "Above $90k", value: "3", sub: "products" },
                  { label: "Accuracy", value: "98.7%", sub: "AI confidence" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/70 rounded-xl p-3 border border-black/08">
                    <div className="text-xl font-black text-[#1a1a1a]" style={{ fontFamily: "'Figtree', sans-serif" }}>{s.value}</div>
                    <div className="text-[10px] font-semibold text-black/50">{s.label}</div>
                    <div className="text-[10px] text-black/35">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Agent log */}
              <div className="rounded-2xl border border-black/10 bg-white/50 overflow-hidden">
                <div className="px-4 py-2 border-b border-black/08 flex items-center justify-between">
                  <span className="text-xs font-bold text-black/60">Agent Log</span>
                  <span className="w-2 h-2 rounded-full bg-[#5CC8B5] animate-pulse" />
                </div>
                <div className="p-3 space-y-1.5 max-h-44 overflow-y-auto">
                  {logMessages.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {m.type === "ok" ? <CheckCircle2 size={11} className="text-[#5CC8B5] mt-0.5 shrink-0" /> : <AlertCircle size={11} className="text-[#F0A855] mt-0.5 shrink-0" />}
                      <span className="text-[11px] text-black/60">{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            centerContent()
          )}
        </div>

        {/* ── Right panel: chart ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-l border-black/08 bg-white/30">
          {/* Chart header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0">
            <div>
              <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">Revenue</p>
              <h2 className="text-2xl font-black text-[#1a1a1a]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                Product Analysis
              </h2>
            </div>
            {/* Viz type switcher */}
            <div className="flex rounded-xl border border-black/12 overflow-hidden bg-white/70">
              {["Line Chart", "Bar Chart", "Area Chart"].map((v) => (
                <button
                  key={v}
                  onClick={() => setVizType(v)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    background: vizType === v ? "#5CC8B5" : "transparent",
                    color: vizType === v ? "#fff" : "rgba(0,0,0,0.5)",
                  }}
                >
                  {v.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart() as React.ReactElement}
            </ResponsiveContainer>
          </div>

          {/* Summary bar */}
          <div className="px-8 py-4 border-t border-black/08 bg-white/50 shrink-0">
            <div className="flex items-center gap-8">
              {[
                { label: "Total Revenue", value: "$878k" },
                { label: "Best Product", value: "P7 · $110k" },
                { label: "Records", value: "284,512" },
                { label: "Confidence", value: "98.7%" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[10px] uppercase tracking-wider text-black/40 font-semibold">{s.label}</div>
                  <div className="text-sm font-black text-[#1a1a1a]" style={{ fontFamily: "'Figtree', sans-serif" }}>{s.value}</div>
                </div>
              ))}
              <button className="ml-auto inline-flex items-center gap-1.5 border border-black/70 rounded-full px-4 py-2 text-xs font-bold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all" style={{ fontFamily: "'Figtree', sans-serif" }}>
                Export <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
