"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Database,
  Loader2,
  ChevronDown,
  Zap,
} from "lucide-react";
import api from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  hasContext?: boolean;
}

const STARTERS = [
  "What are the top 5 rows in my data?",
  "Summarize the key trends",
  "What columns have missing values?",
  "Give me a quick statistical overview",
];

interface AIAgentPopupProps {
  filePath?: string | null;
}

export default function AIAgentPopup({ filePath }: AIAgentPopupProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your ReportWise AI assistant. I can answer questions about your uploaded data or help you explore analytics. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
    }
  }, [messages, open]);

  // Count unread when closed
  useEffect(() => {
    if (!open && messages.length > 1) {
      setUnread((u) => u + 1);
    }
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await api.agentChat(msg, filePath, history);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.response || "I couldn't generate a response. Please try again.",
          hasContext: result.has_context,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an error. Make sure the backend is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, filePath]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Bubble ── */}
      <button
        onClick={() => { setOpen((o) => !o); setUnread(0); }}
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 1000,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #D96B43 0%, #764BA2 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(217,107,67,0.45)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 6px 32px rgba(217,107,67,0.6)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 4px 24px rgba(217,107,67,0.45)";
        }}
        aria-label="Toggle AI assistant"
      >
        {open ? (
          <ChevronDown size={22} color="white" />
        ) : (
          <Bot size={22} color="white" />
        )}
        {unread > 0 && !open && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#ef4444",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat Window ── */}
      <div
        style={{
          position: "fixed",
          bottom: "96px",
          right: "28px",
          zIndex: 999,
          width: "360px",
          height: "520px",
          borderRadius: "24px",
          background: "#FAF8F5",
          border: "1.5px solid #E5DFD7",
          boxShadow: "0 20px 60px rgba(44,37,35,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.25s, transform 0.25s",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #E5DFD7",
            background: "linear-gradient(135deg, #D96B43 0%, #764BA2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: "13px", margin: 0 }}>
                ReportWise AI
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", margin: 0 }}>
                {filePath ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Database size={9} /> RAG-powered • data loaded
                  </span>
                ) : (
                  "General assistant"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "8px",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    msg.role === "user"
                      ? "#D96B43"
                      : "linear-gradient(135deg,#D96B43,#764BA2)",
                }}
              >
                {msg.role === "user" ? (
                  <User size={13} color="white" />
                ) : (
                  <Bot size={13} color="white" />
                )}
              </div>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "78%",
                  padding: "10px 12px",
                  borderRadius:
                    msg.role === "user"
                      ? "16px 4px 16px 16px"
                      : "4px 16px 16px 16px",
                  background:
                    msg.role === "user" ? "#D96B43" : "white",
                  border: msg.role === "assistant" ? "1px solid #E5DFD7" : "none",
                  boxShadow:
                    msg.role === "assistant"
                      ? "0 1px 4px rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.55",
                    color: msg.role === "user" ? "white" : "#2C2523",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </p>
                {msg.hasContext && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "6px",
                    }}
                  >
                    <Database size={8} style={{ color: "#5CC8B5" }} />
                    <span style={{ fontSize: "9px", color: "#5CC8B5", fontWeight: 600 }}>
                      From your data
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#D96B43,#764BA2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bot size={13} color="white" />
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  background: "white",
                  border: "1px solid #E5DFD7",
                  borderRadius: "4px 16px 16px 16px",
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                {[0, 0.15, 0.3].map((d, idx) => (
                  <span
                    key={idx}
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#D96B43",
                      animation: `bounce 0.9s ${d}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starters (show only on first message) */}
        {messages.length === 1 && (
          <div
            style={{
              padding: "0 10px 8px",
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  fontSize: "10px",
                  padding: "5px 10px",
                  borderRadius: "20px",
                  border: "1px solid #E5DFD7",
                  background: "white",
                  color: "#2C2523",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#D96B43";
                  (e.currentTarget as HTMLElement).style.color = "#D96B43";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E5DFD7";
                  (e.currentTarget as HTMLElement).style.color = "#2C2523";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div
          style={{
            padding: "10px",
            borderTop: "1px solid #E5DFD7",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
            background: "white",
            flexShrink: 0,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data..."
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "1.5px solid #E5DFD7",
              borderRadius: "12px",
              padding: "8px 12px",
              fontSize: "12px",
              fontFamily: "inherit",
              color: "#2C2523",
              outline: "none",
              background: "#FAF8F5",
              lineHeight: "1.5",
              maxHeight: "80px",
              overflow: "auto",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#D96B43")}
            onBlur={(e) => (e.target.style.borderColor = "#E5DFD7")}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background:
                !input.trim() || loading ? "#E5DFD7" : "#D96B43",
              border: "none",
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            {loading ? (
              <Loader2 size={15} color="white" style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Send size={15} color={!input.trim() ? "rgba(0,0,0,0.3)" : "white"} />
            )}
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
