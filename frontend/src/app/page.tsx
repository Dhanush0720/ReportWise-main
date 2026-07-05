"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Search,
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
  Star,
  LogOut,
  User,
  MessageSquare,
  UserCircle,
  BarChart4,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import FileUpload from "@/components/FileUpload";
import ChatInterface from "@/components/ChatInterface";
import ChartDisplay from "@/components/ChartDisplay";
import ExportPanel from "@/components/ExportPanel";
import PresentationDeck from "@/components/PresentationDeck";
import LoginModal from "@/components/LoginModal";
import ChatHistoryPanel from "@/components/ChatHistoryPanel";
import ProfileSection from "@/components/ProfileSection";
import AIAgentPopup from "@/components/AIAgentPopup";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getChatHistory, ChatHistoryEntry, getUserProfile } from "@/lib/firestore";

const tickerItems = [
  { icon: Zap, label: "Autonomous Multi-Agent" },
  { icon: Cpu, label: "Real-time Analysis" },
  { icon: Database, label: "284K+ Records" },
  { icon: TrendingUp, label: "Export to Tableau" },
  { icon: Wifi, label: "Live Data Sync" },
];

const navItems = [
  {
    id: "upload",
    label: "Upload\nData",
    icon: Upload,
    bg: "#D96B43",
    text: "#fff",
  },
  {
    id: "query",
    label: "Query",
    icon: Search,
    bg: "#C89E7A",
    text: "#fff",
  },
  {
    id: "export",
    label: "Export",
    icon: Download,
    bg: "#5E7C62",
    text: "#fff",
  },

  {
    id: "presentation",
    label: "Pitch\nDeck",
    icon: FileBarChart,
    bg: "#764BA2",
    text: "#fff",
  },
  {
    id: "studio",
    label: "Analytics\nStudio",
    icon: BarChart4,
    bg: "#E2B980",
    text: "#fff",
  },
  {
    id: "etl",
    label: "AI ETL\nStudio",
    icon: RefreshCw,
    bg: "#4B6154",
    text: "#fff",
  },
];

const exportOptions = [
  { label: "Export for Tableau", color: "#E8762D", action: "tableau" },
  { label: "Export for Power BI", color: "#F2C811", action: "powerbi" },
  { label: "Export All Formats", color: "#5CC8B5", action: "all" },
];

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string>("upload");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [serverFilePath, setServerFilePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Chat history and user profile states
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load chat history and profile when user logs in
  useEffect(() => {
    if (!user) {
      setChatHistory([]);
      setUserProfile(null);
      return;
    }
    getChatHistory(user.uid).then(setChatHistory);
    getUserProfile(user.uid).then(setUserProfile);
  }, [user]);

  // Data Analytics Studio states
  const [activeProfileTab, setActiveProfileTab] = useState<string>("profile");
  const [studioSelectedFile, setStudioSelectedFile] = useState<string | null>(null);
  const [studioSelectedTechnique, setStudioSelectedTechnique] = useState<string>("descriptive");
  const [studioAnalysisResult, setStudioAnalysisResult] = useState<any>(null);
  const [studioLoading, setStudioLoading] = useState<boolean>(false);
  const [studioFileList, setStudioFileList] = useState<any[]>([]);

  const loadStudioFiles = async () => {
    try {
      const files = await api.getUploadedFiles();
      setStudioFileList(files || []);
      if (files && files.length > 0 && !studioSelectedFile) {
        setStudioSelectedFile(`uploads/${files[0].name}`);
      }
    } catch (e) {
      console.error("Error loading files in studio:", e);
    }
  };

  useEffect(() => {
    if (profileModalOpen) {
      loadStudioFiles();
    }
  }, [profileModalOpen]);

  const handleStudioAnalyze = async () => {
    if (!studioSelectedFile) return;
    try {
      setStudioLoading(true);
      setStudioAnalysisResult(null);
      
      let queryText = "";
      if (studioSelectedTechnique === "descriptive") {
        queryText = "Perform Descriptive Analytics. Summarize data statistics, values, and distributions.";
      } else if (studioSelectedTechnique === "diagnostic") {
        queryText = "Perform Diagnostic Analytics. Identify correlations, anomalies, and trace the causal factors of the changes in the dataset.";
      } else if (studioSelectedTechnique === "predictive") {
        queryText = "Perform Predictive Analytics. Conduct time-series forecasting, trend projections, or regressions over key metrics.";
      } else if (studioSelectedTechnique === "prescriptive") {
        queryText = "Perform Prescriptive Analytics. Recommend optimal business decisions, action points, and future scenarios.";
      } else if (studioSelectedTechnique === "statistical") {
        queryText = "Perform Statistical Outlier Analysis. Calculate distributions, ANOVA significance, outliers, and variance.";
      } else if (studioSelectedTechnique === "clustering") {
        queryText = "Perform Cluster and Segment Analysis. Identify distinct segments, group points, and highlight properties of the clusters.";
      }
      
      const response = await api.analyze(queryText, studioSelectedFile);
      setStudioAnalysisResult(response);
    } catch (e) {
      console.error("Studio analysis failed:", e);
    } finally {
      setStudioLoading(false);
    }
  };

  const [etlRecommendations, setEtlRecommendations] = useState<any[]>([]);
  const [etlCode, setEtlCode] = useState<string>("");
  const [etlLoading, setEtlLoading] = useState(false);
  const [etlDownloadUrl, setEtlDownloadUrl] = useState<string | null>(null);
  const [etlError, setEtlError] = useState<string | null>(null);

  const handleGenerateEtl = async () => {
    try {
      setEtlLoading(true);
      setEtlError(null);
      setEtlRecommendations([]);
      setEtlCode("");
      
      const response = await api.client.post("/generate-etl", {
        file_path: serverFilePath
      });
      
      if (response.data.success) {
        setEtlRecommendations(response.data.recommendations || []);
        setEtlCode(response.data.etl_code || "");
        setEtlDownloadUrl(response.data.download_url || null);
      } else {
        setEtlError("Generation succeeded but returned an unexpected result");
      }
    } catch (err: any) {
      console.error("ETL generation failed:", err);
      setEtlError(err.response?.data?.detail || err.message || "Failed to generate ETL pipeline");
    } finally {
      setEtlLoading(false);
    }
  };

  const downloadEtlScript = async () => {
    if (!etlDownloadUrl) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}${etlDownloadUrl}`);
      const disposition = response.headers.get("content-disposition");
      let filename = "etl_pipeline.py";
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match?.[1]) filename = match[1].replace(/['"]/g, "").trim();
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
      console.error("ETL Download error:", err);
    }
  };

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [vizType, setVizType] = useState("Line Chart");
  const [vizOpen, setVizOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fetchSchema = async (filePath: string) => {
    try {
      setSchemaLoading(true);
      const response = await api.client.get("/data-schema", {
        params: { file_path: filePath }
      });
      setSchemaInfo(response.data);
    } catch (err) {
      console.error("Failed to load schema:", err);
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadedFile(file.name);
      setSchemaInfo(null);
      setServerFilePath(null);
      
      const response = await api.uploadFile(file);
      if (response.success) {
        setServerFilePath(response.path);
        fetchSchema(response.path);
        // Trigger RAG indexing in background
        api.ragIndex(response.path);
      }
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleAnalyze = () => {
    if (uploadedFile) {
      setActiveNav("query");
    }
  };

  const chartData = analysisResult?.result?.chart_data
    ? [
        {
          name: "Data",
          value: analysisResult.result.chart_data.values?.[0] || 0,
        },
      ]
    : [];

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#F4F0EB" }}
    >
      {/* Fauna Robotics Inspired Header */}
      <header className="w-full flex items-center justify-between px-12 py-6 bg-[#F4F0EB] shrink-0 relative">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <span
            className="text-3xl font-black tracking-tight text-[#2C2523]"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            ReportWise
          </span>
        </div>

        {/* Floating Menu Pill (Matches the Home, Product, Company capsule) - Absolutely Centered in the middle */}
        <div 
          className="absolute flex items-center gap-1 bg-[#FAF8F5]/80 border border-[#E5DFD7] rounded-full p-1 shadow-sm"
          style={{ left: "50%", transform: "translateX(-50%)" }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                activeNav === item.id
                  ? "bg-[#FAF8F5] text-[#D96B43] shadow-sm border border-[#E5DFD7]"
                  : "text-[#2C2523]/70 hover:text-[#2C2523] hover:bg-[#E5DFD7]/20"
              }`}
            >
              {item.label.replace('\n', ' ')}
            </button>
          ))}
        </div>

        {/* CTA Button - Login/Logout */}
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setProfileModalOpen(true)}
                title="Edit profile settings"
                className="text-xs font-bold text-[#2C2523] bg-white/60 hover:bg-white/80 hover:border-[#D96B43]/50 px-4 py-2 rounded-full border border-[#E5DFD7] flex items-center gap-2 shadow-sm transition-all"
              >
                <UserCircle size={14} className="text-[#D96B43]" />
                <span>{userProfile?.displayName || user.email}</span>
              </button>
              <button
                onClick={() => logout()}
                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md bg-[#D96B43] text-white hover:bg-[#D96B43]/90"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </header>

      {/* Main 2-card layout (beneath header) */}
      <div className="flex flex-1 overflow-hidden px-12 pb-8 gap-6 bg-[#F4F0EB]">
        {/* ── Center content (Floating Card) ── */}
        <div
          className="flex flex-col justify-start px-8 py-10 overflow-y-auto bg-[#FAF8F5] border border-[#E5DFD7] rounded-[2rem] shadow-sm shrink-0"
          style={{ width: "420px" }}
        >

          {activeNav === "upload" ? (
            <>
              <span className="inline-flex items-center border border-[#E5DFD7] rounded-full px-3 py-1 text-xs font-semibold text-black/60 mb-5 w-fit bg-white/40">
                Upload Data File
              </span>
              <h1
                className="text-4xl font-black text-[#2C2523] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Capable, fast, smart.
                <br />
                Reports for everyone.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-7 max-w-xs">
                Upload any CSV, XLSX, or JSON file. Our autonomous agents will
                parse, analyse, and surface insights in seconds.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[1.5rem] p-6 text-center cursor-pointer transition-all mb-6 ${
                  isDragging
                    ? "border-[#D96B43] bg-[#D96B43]/5"
                    : "border-[#E5DFD7] hover:border-[#D96B43] hover:bg-[#D96B43]/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.parquet,.hdf5,.zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFileUpload(f);
                    }
                  }}
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={15} className="text-[#D96B43]" />
                    <span className="text-sm font-semibold text-[#2C2523] font-mono truncate max-w-[200px]">
                      {uploadedFile}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setServerFilePath(null);
                        setSchemaInfo(null);
                      }}
                      className="text-black/30 hover:text-black/60 ml-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="text-[#D96B43] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#2C2523]/70">
                      Drop file here or click to browse
                    </p>
                    <p className="text-xs text-black/35 mt-1">CSV · XLSX · JSON · ZIP</p>
                  </>
                )}
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-black/55 font-semibold mb-4 animate-pulse">
                  <RefreshCw size={12} className="animate-spin text-[#D96B43]" />
                  Uploading file to environment...
                </div>
              )}

              {schemaLoading && (
                <div className="flex items-center gap-2 text-xs text-black/55 font-semibold mb-4 animate-pulse">
                  <RefreshCw size={12} className="animate-spin text-[#D96B43]" />
                  Extracting schema and validating data health...
                </div>
              )}

              {schemaInfo && (
                <div className="mb-6 p-4 rounded-2xl border border-black/10 bg-white/40 backdrop-blur-md transition-all">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-black/55 mb-3">
                  DATA HEALTH DIAGNOSTICS
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/60 p-2 rounded-lg border border-black/05">
                      <span className="text-[9px] text-black/40 block font-medium">Rows x Cols</span>
                      <span className="text-xs font-bold text-black/80">
                        {schemaInfo.diagnostics.rows} x {schemaInfo.diagnostics.cols}
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border border-black/05">
                      <span className="text-[9px] text-black/40 block font-medium">Completeness</span>
                      <span className="text-xs font-bold text-black/80">
                        {schemaInfo.diagnostics.completeness.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border border-black/05">
                      <span className="text-[9px] text-black/40 block font-medium">Duplicates</span>
                      <span className="text-xs font-bold text-black/80">
                        {schemaInfo.diagnostics.duplicates} rows
                      </span>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border border-black/05">
                      <span className="text-[9px] text-black/40 block font-medium">Missing Cells</span>
                      <span className="text-xs font-bold text-black/80">
                        {schemaInfo.diagnostics.missing_cells} cells
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="text-[9px] uppercase font-bold text-black/40 mb-2">Column Catalog</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {Object.entries(schemaInfo.schema).map(([name, info]: [string, any]) => (
                      <div key={name} className="flex justify-between items-center text-xs py-1 border-b border-black/05 last:border-b-0">
                        <span className="font-mono text-black/70 truncate max-w-[150px]">{name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="bg-black/05 px-1 py-0.5 rounded text-[8px] text-black/60 font-semibold">{info.dtype}</span>
                          {info.outlier_count > 0 && (
                            <span className="bg-orange-50 text-orange-600 border border-orange-100 px-1 py-0.5 rounded text-[8px] font-bold">
                              {info.outlier_count} outliers
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze CTA */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || uploading || schemaLoading || !uploadedFile}
                className="inline-flex items-center gap-2 border border-black/80 rounded-full px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1a1a1a]"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                <Play size={14} />
                Analyze Data
              </button>
            </>
          ) : activeNav === "query" ? (
            <>
              <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
                Natural Language Query
              </span>
              <h1
                className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Ask your data
                <br />
                anything.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-6 max-w-xs">
                Type a plain-English question and our AI will translate it into
                an analysis and visualisation.
              </p>

              <ChatInterface
                filePath={serverFilePath}
                onAnalysisStart={() => setAgentLogs([])}
                onAnalysisComplete={(result) => {
                  setAnalysisResult(result);
                  // Refresh history after new query
                  if (user) getChatHistory(user.uid).then(setChatHistory);
                }}
                onLogsUpdate={setAgentLogs}
                schemaInfo={schemaInfo}
              />
            </>
          ) : activeNav === "export" ? (
            <>
              <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
                Export Results
              </span>
              <h1
                className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Share insights
                <br />
                anywhere.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-8 max-w-xs">
                Export your analysis to Tableau, Power BI, or download in
                multiple formats for any workflow.
              </p>

              <ExportPanel
                query={analysisResult?.query || ""}
                filePath={serverFilePath}
                analysisResult={analysisResult}
              />
            </>
          ) : activeNav === "chat" ? (
            <>
              <span className="inline-flex items-center border border-[#E5DFD7] rounded-full px-3 py-1 text-xs font-semibold text-black/60 mb-5 w-fit bg-white/40">
                Chat History
              </span>
              <h1
                className="text-4xl font-black text-[#2C2523] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Your past
                <br />
                queries.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-4 max-w-xs">
                Browse and replay your previous analyses. Click any entry to run it again.
              </p>
            </>
          ) : activeNav === "profile" ? (
            <>
              <span className="inline-flex items-center border border-[#E5DFD7] rounded-full px-3 py-1 text-xs font-semibold text-black/60 mb-5 w-fit bg-white/40">
                Your Account
              </span>
              <h1
                className="text-4xl font-black text-[#2C2523] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Profile &
                <br />
                Settings.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-4 max-w-xs">
                Edit your display name, avatar, and account details.
              </p>
            </>
          ) : activeNav === "login" ? (
            <>
              <span className="inline-flex items-center border border-[#E5DFD7] rounded-full px-3 py-1 text-xs font-semibold text-black/60 mb-5 w-fit bg-white/40">
                {user ? "Account" : "Authentication"}
              </span>
              <h1
                className="text-4xl font-black text-[#2C2523] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                {user ? "Welcome Back" : "Secure Access"}
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-7 max-w-xs">
                {user
                  ? `You are logged in as ${user.email}`
                  : "Sign in to your account or create a new one to get started."}
              </p>
              {user ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/50 border border-[#E5DFD7]">
                    <p className="text-xs font-bold text-[#2C2523] mb-1">Email</p>
                    <p className="text-sm text-black/70">{user.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/50 border border-[#E5DFD7]">
                    <p className="text-xs font-bold text-[#2C2523] mb-1">Account Status</p>
                    <p className="text-sm text-green-600 font-semibold">Verified</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs shadow transition mt-4"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-bold text-xs shadow transition uppercase tracking-wider"
                >
                  Open Login
                </button>
              )}
            </>
          ) : activeNav === "presentation" ? (
            <>
              <span className="inline-flex items-center border border-[#E5DFD7] rounded-full px-3 py-1 text-xs font-semibold text-black/60 mb-5 w-fit bg-white/40">
                Presentation Deck
              </span>
              <h1
                className="text-4xl font-black text-[#2C2523] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                8-10 Slide
                <br />
                Pitch Decks.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-7 max-w-xs">
                Create professional presentation decks with visualizations,
                metrics, bullet points, and full-screen presentation mode.
              </p>
              <PresentationDeck
                query={analysisResult?.query || ""}
                filePath={serverFilePath}
                analysisResult={analysisResult}
              />
            </>
          ) : activeNav === "studio" ? (
            <>
              <span className="inline-flex items-center border border-[#E5DFD7] rounded-full px-3 py-1 text-xs font-semibold text-black/60 mb-5 w-fit bg-white/40">
                Analytics Studio
              </span>
              <h1
                className="text-4xl font-black text-[#2C2523] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Autonomous
                <br />
                Analytics.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-7 max-w-xs">
                Select a dataset and select an AI analytics algorithm to run deep statistical profiling.
              </p>

              <div className="space-y-4">
                {/* 1. File Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-black/50">1. Select Dataset</label>
                  {studioFileList.length > 0 ? (
                    <select
                      value={studioSelectedFile || ""}
                      onChange={(e) => setStudioSelectedFile(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E5DFD7] text-xs font-bold text-[#2C2523] outline-none"
                    >
                      {studioFileList.map((f) => (
                        <option key={f.name} value={`uploads/${f.name}`}>
                          {f.name} ({(f.size_kb).toFixed(1)} KB)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-center text-xs text-orange-700 font-bold">
                      No files uploaded yet.
                    </div>
                  )}
                </div>

                {/* 2. Technique Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-black/50">2. Analytics Technique</label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { id: "descriptive", label: "Descriptive Analytics", desc: "Summarize data distributions and statistics." },
                      { id: "diagnostic", label: "Diagnostic Analytics", desc: "Investigate causal factors and correlations." },
                      { id: "predictive", label: "Predictive (Forecast)", desc: "Generate future forecasts and trendlines." },
                      { id: "prescriptive", label: "Prescriptive Analytics", desc: "Generate actionable optimization tips." },
                      { id: "statistical", label: "Statistical Outliers", desc: "Analyse outliers, variance, and anomaly values." },
                      { id: "clustering", label: "Cluster/Segmentation", desc: "Segment data records into distinct clusters." }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setStudioSelectedTechnique(t.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          studioSelectedTechnique === t.id
                            ? "border-[#D96B43] bg-[#D96B43]/5 shadow-sm"
                            : "border-[#E5DFD7] bg-white hover:border-[#D96B43]/30"
                        }`}
                      >
                        <p className="text-xs font-black text-[#2C2523] mb-0.5">{t.label}</p>
                        <p className="text-[10px] text-black/50 leading-normal">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Run Button */}
                <button
                  onClick={handleStudioAnalyze}
                  disabled={studioLoading || !studioSelectedFile}
                  className="w-full py-3 bg-[#D96B43] hover:bg-[#D96B43]/90 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-all mt-4"
                >
                  {studioLoading ? "Processing Analytics..." : "Run AI Analytics"}
                </button>
              </div>
            </>
          ) : activeNav === "etl" ? (
            <>
              <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
                AI ETL Studio
              </span>
              <h1
                className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Auto-clean
                <br />
                your data pipeline.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-6 max-w-xs">
                Inspect quality issues, format columns, clip outliers, and download a production Pandas ETL script.
              </p>

              <div className="backdrop-blur-md bg-white/40 border border-black/10 rounded-2xl p-6 shadow-sm space-y-4">
                {!etlCode ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleGenerateEtl}
                      disabled={etlLoading || !serverFilePath}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-sm transition uppercase tracking-wider"
                    >
                      {etlLoading ? "Analyzing & Generating Code..." : "Generate Clean ETL Pipeline"}
                    </button>
                    {etlLoading && (
                      <p className="text-xs text-black/55 text-center animate-pulse font-semibold">
                        AI workforce is identifying data anomalies and writing Python code...
                      </p>
                    )}
                    {etlError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs text-red-600 font-semibold">{etlError}</p>
                      </div>
                    )}
                    {!serverFilePath && (
                      <p className="text-[10px] text-black/35 text-center">
                        Upload a file first to enable pipeline generation
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#5CC8B5]/10 border border-[#5CC8B5]/20 rounded-xl">
                      <p className="text-xs text-[#2c786a] font-bold text-center">
                        ETL Cleaning pipeline generated successfully!
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={downloadEtlScript}
                        className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
                      >
                        <span>Download ETL Script (.py)</span>
                        <br />
                        <span className="text-[10px] text-black/45 font-medium">Click to download standalone Pandas script</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(etlCode);
                          alert("Code copied to clipboard!");
                        }}
                        className="w-full px-4 py-2.5 bg-white hover:bg-white/80 border border-black/10 rounded-xl text-left text-xs font-bold text-[#1a1a1a] shadow-sm transition"
                      >
                        <span>Copy Code to Clipboard</span>
                        <br />
                        <span className="text-[10px] text-black/45 font-medium">Quick copy snippet</span>
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 border-t border-black/05 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">Auto-detected Adjustments:</p>
                      {etlRecommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="bg-white/50 border border-black/05 p-2.5 rounded-lg text-left text-xs font-semibold">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-black/75 truncate max-w-[150px]">{rec.column}</span>
                            <span className="bg-black/05 px-1.5 py-0.5 rounded text-[8px] font-bold text-black/55 uppercase">{rec.action?.split(' ')[0] || "Impute"}</span>
                          </div>
                          <p className="text-[10px] text-black/60 font-semibold mb-0.5"><span className="text-black/40 font-bold">Issue:</span> {rec.issue}</p>
                          <p className="text-[10px] text-black/60 font-semibold"><span className="text-black/40 font-bold">Action:</span> {rec.action}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setEtlCode("");
                        setEtlRecommendations([]);
                      }}
                      className="w-full px-4 py-2 bg-black hover:bg-black/95 text-white font-bold text-xs rounded-full shadow transition"
                    >
                      ← Generate Another Pipeline
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="inline-flex items-center border border-black/20 rounded-full px-3 py-1 text-xs font-medium text-black/60 mb-5">
                Analysis Results
              </span>
              <h1
                className="text-4xl font-black text-[#1a1a1a] leading-[1.1] mb-4"
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                Your data,
                <br />
                visualised.
              </h1>
              <p className="text-sm text-black/55 leading-relaxed mb-6 max-w-xs">
                {analysisResult?.result?.summary || "Run an analysis to see results"}
              </p>

              {/* Agent log */}
              <div className="rounded-2xl border border-black/10 bg-white/50 overflow-hidden">
                <div className="px-4 py-2 border-b border-black/08 flex items-center justify-between">
                  <span className="text-xs font-bold text-black/60">Agent Log</span>
                  <span className="w-2 h-2 rounded-full bg-[#5CC8B5] animate-pulse" />
                </div>
                <div className="p-3 space-y-1.5 max-h-44 overflow-y-auto">
                  {agentLogs.map((m: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      {m.type === "ok" || m.message?.includes("✓") ? (
                        <CheckCircle2
                          size={11}
                          className="text-[#5CC8B5] mt-0.5 shrink-0"
                        />
                      ) : (
                        <AlertCircle
                          size={11}
                          className="text-[#F0A855] mt-0.5 shrink-0"
                        />
                      )}
                      <span className="text-[11px] text-black/60">{m.message || m.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right panel: context-aware per tab ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF8F5] border border-[#E5DFD7] rounded-[2rem] shadow-sm">

          {/* UPLOAD tab → file info / schema preview */}
          {activeNav === "upload" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0 border-b border-[#E5DFD7]">
                <div>
                  <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">Data Preview</p>
                  <h2 className="text-2xl font-black text-[#2C2523]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                    {uploadedFile ? uploadedFile : "No File Loaded"}
                  </h2>
                </div>
                {uploadedFile && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#D96B43]/10 text-[#D96B43] border border-[#D96B43]/20">
                    Loaded
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {schemaLoading && (
                  <div className="flex items-center gap-3 text-sm text-black/50 animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    Reading schema...
                  </div>
                )}
                {schemaInfo && !schemaLoading && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-white/70 border border-[#E5DFD7] text-center">
                        <p className="text-2xl font-black text-[#D96B43]">{schemaInfo.diagnostics?.rows?.toLocaleString() || "—"}</p>
                        <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mt-1">Rows</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/70 border border-[#E5DFD7] text-center">
                        <p className="text-2xl font-black text-[#5E7C62]">{schemaInfo.diagnostics?.cols || "—"}</p>
                        <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mt-1">Columns</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/70 border border-[#E5DFD7] text-center">
                        <p className="text-2xl font-black text-[#C89E7A]">{schemaInfo.diagnostics?.missing_cells ?? "—"}</p>
                        <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mt-1">Missing Cells</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/70 border border-[#E5DFD7] flex items-center justify-between">
                      <span className="text-xs text-black/50">Completeness</span>
                      <span className="text-xs font-black text-[#5E7C62]">{schemaInfo.diagnostics?.completeness?.toFixed(1) ?? "—"}%</span>
                    </div>
                    <div className="rounded-2xl border border-[#E5DFD7] overflow-hidden">
                      <div className="px-5 py-3 bg-white/60 border-b border-[#E5DFD7]">
                        <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">Column Schema</p>
                      </div>
                      <div className="divide-y divide-[#E5DFD7] max-h-64 overflow-y-auto">
                        {schemaInfo.schema && Object.entries(schemaInfo.schema as Record<string, any>).map(([col, info]: [string, any]) => (
                          <div key={col} className="flex items-center justify-between px-5 py-2.5 hover:bg-white/40 transition">
                            <span className="text-xs font-semibold text-[#2C2523] truncate max-w-[50%]">{col}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono bg-[#E5DFD7]/60 text-black/60 px-2 py-0.5 rounded">{info.dtype}</span>
                              {info.outlier_count > 0 && (
                                <span className="text-[10px] text-orange-500 font-semibold">{info.outlier_count} outliers</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {!schemaInfo && !schemaLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#E5DFD7] flex items-center justify-center">
                      <Database size={24} className="text-black/30" />
                    </div>
                    <p className="text-sm text-black/40">Upload a file to preview its schema here</p>
                  </div>
                )}
              </div>
              <div className="px-8 py-4 border-t border-[#E5DFD7] shrink-0">
                <p className="text-xs text-black/40">{uploadedFile ? `${uploadedFile} ready for analysis` : "No file uploaded yet"}</p>
              </div>
            </div>
          )}

          {/* QUERY tab → ChartDisplay */}
          {activeNav === "query" && (
            <ChartDisplay data={analysisResult} />
          )}

          {/* EXPORT tab → format cards or empty state */}
          {activeNav === "export" && (
            <div className="flex flex-col h-full">
              <div className="px-8 pt-7 pb-4 shrink-0 border-b border-[#E5DFD7]">
                <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">Export Preview</p>
                <h2 className="text-2xl font-black text-[#2C2523]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  {analysisResult ? "Ready to Export" : "No Analysis Yet"}
                </h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
                {analysisResult ? (
                  <div className="w-full space-y-3">
                    {[
                      { label: "Tableau", ext: "CSV", color: "#D96B43", desc: "Optimised for Tableau workbooks" },
                      { label: "Power BI", ext: "JSON", color: "#5E7C62", desc: "Ready for Power BI data model" },
                      { label: "Excel", ext: "XLSX", color: "#C89E7A", desc: "Standard spreadsheet format" },
                      { label: "Raw JSON", ext: "JSON", color: "#4B6154", desc: "Machine-readable structured data" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-[#E5DFD7]">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: f.color + "18", border: `1px solid ${f.color}30` }}>
                          <span className="text-[10px] font-black" style={{ color: f.color }}>{f.ext}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2C2523]">{f.label}</p>
                          <p className="text-[11px] text-black/45">{f.desc}</p>
                        </div>
                        <Download size={13} className="text-black/25 shrink-0" />
                      </div>
                    ))}
                    <p className="text-[11px] text-black/35 text-center pt-1">Use the Export panel on the left to download</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#E5DFD7] flex items-center justify-center">
                      <Download size={24} className="text-black/30" />
                    </div>
                    <p className="text-sm text-black/40 max-w-xs">Run a query first, then export your analysis in multiple formats</p>
                  </div>
                )}
              </div>
              <div className="px-8 py-4 border-t border-[#E5DFD7] shrink-0">
                <p className="text-xs text-black/40">{analysisResult ? "Analysis ready — select a format on the left" : "No data to export yet"}</p>
              </div>
            </div>
          )}

          {/* ETL tab → code viewer or empty state */}
          {activeNav === "etl" && (
            <div className="flex flex-col h-full">
              <div className="px-8 pt-7 pb-4 shrink-0 border-b border-[#E5DFD7]">
                <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">Pipeline Preview</p>
                <h2 className="text-2xl font-black text-[#2C2523]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  {etlCode ? "ETL Script Ready" : "No Pipeline Yet"}
                </h2>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {etlCode ? (
                  <pre className="flex-1 overflow-auto px-6 py-5 text-[11px] leading-relaxed font-mono text-[#3E3A39] bg-[#F4F0EB]">
                    {etlCode}
                  </pre>
                ) : etlLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <RefreshCw size={20} className="animate-spin text-[#D96B43]" />
                    <p className="text-sm text-black/40 animate-pulse">Generating ETL pipeline...</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#E5DFD7] flex items-center justify-center">
                      <Cpu size={24} className="text-black/30" />
                    </div>
                    <p className="text-sm text-black/40 max-w-xs">Generate your ETL pipeline on the left — the Python script will appear here</p>
                  </div>
                )}
              </div>
              <div className="px-8 py-4 border-t border-[#E5DFD7] shrink-0">
                <p className="text-xs text-black/40">{etlCode ? "Pandas ETL script ready to download" : "No ETL code generated yet"}</p>
              </div>
            </div>
          )}
          {/* ANALYTICS STUDIO Right Panel */}
          {activeNav === "studio" && (
            <div className="flex-grow flex flex-col h-full overflow-hidden bg-white/40">
              {studioLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-[#D96B43]" size={28} />
                  <p className="text-sm font-bold text-black/50 animate-pulse">Running advanced AI analytics models...</p>
                </div>
              ) : studioAnalysisResult ? (
                <div className="flex-grow flex flex-col h-full overflow-hidden">
                  <ChartDisplay data={studioAnalysisResult} />
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-black/40">
                  <BarChart4 size={48} className="text-[#D96B43]/40 mb-3" />
                  <h3 className="text-base font-bold text-[#2C2523] mb-1">Analytics Studio Workspace</h3>
                  <p className="text-xs max-w-xs leading-normal">
                    Select a dataset and analytical algorithm on the left, then run the engine to preview full visualizations.
                  </p>
                </div>
              )}
            </div>
          )}




          {/* LOGIN tab → User Account */}
          {activeNav === "login" && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-1">Account</p>
                <h2 className="text-2xl font-black text-[#2C2523]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  User Profile
                </h2>
                <p className="text-sm text-black/50 mt-1">{user ? "Your account details" : "Sign in to view your profile"}</p>
              </div>
              {user && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/50 border border-[#E5DFD7]">
                    <p className="text-xs font-bold text-black/60 mb-1">Email</p>
                    <p className="text-sm font-mono text-[#2C2523]">{user.email}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50 border border-[#E5DFD7]">
                    <p className="text-xs font-bold text-black/60 mb-1">User ID</p>
                    <p className="text-sm font-mono text-[#2C2523]">{user.uid.slice(0, 12)}...</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs font-bold text-green-700 mb-1">Status</p>
                    <p className="text-sm text-green-600">Authenticated</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* AI Agent Popup — always rendered, fixed overlay */}
      <AIAgentPopup filePath={activeNav === "upload" ? null : serverFilePath} />

      {/* Login Modal */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Profile Modal */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="w-[500px] max-h-[85vh] bg-[#FAF8F5] border border-[#E5DFD7] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0 border-b border-[#E5DFD7]">
              <div>
                <p className="text-xs uppercase tracking-widest text-black/40 font-semibold mb-0.5">User Hub</p>
                <h2 className="text-2xl font-black text-[#2C2523]" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  {activeProfileTab === "profile" ? "Account Profile" : "Query History"}
                </h2>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 text-[#2C2523] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex px-8 border-b border-[#E5DFD7] bg-[#FAF8F5] shrink-0 gap-4">
              {[
                { id: "profile", label: "Edit Profile" },
                { id: "history", label: "Query History" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveProfileTab(tab.id);
                  }}
                  className={`py-3 text-xs font-bold transition-all relative border-b-2 ${
                    activeProfileTab === tab.id
                      ? "border-[#D96B43] text-[#D96B43]"
                      : "border-transparent text-black/40 hover:text-black/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 min-h-[400px]">
              {activeProfileTab === "profile" && (
                <ProfileSection onSaveComplete={(updated) => {
                  setUserProfile(updated);
                  setProfileModalOpen(false);
                }} />
              )}

              {activeProfileTab === "history" && (
                <div className="flex flex-col h-[400px]">
                  <ChatHistoryPanel
                    userId={user?.uid || null}
                    entries={chatHistory}
                    onReplay={(q) => {
                      setProfileModalOpen(false);
                      setActiveNav("query");
                      // small delay so query tab renders first
                      setTimeout(() => {
                        const ta = document.querySelector<HTMLTextAreaElement>("textarea");
                        if (ta) { ta.value = q; ta.dispatchEvent(new Event("input", { bubbles: true })); }
                      }, 150);
                    }}
                    onClear={() => setChatHistory([])}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
