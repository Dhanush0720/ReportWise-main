"use client";

import React, { useEffect, useRef } from "react";

interface Log {
  agent: string;
  message: string;
  timestamp: number;
}

interface TerminalLogProps {
  logs: Log[];
}

const getAgentColor = (agent: string): string => {
  switch (agent) {
    case "Manager":
      return "text-blue-400";
    case "Developer":
      return "text-green-400";
    case "QA":
      return "text-yellow-400";
    case "System":
      return "text-cyan-400";
    case "Error":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
};

export default function TerminalLog({ logs }: TerminalLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-96 overflow-y-auto terminal-log">
      <h2 className="text-lg font-bold text-white mb-4">🖥️ Agent Thoughts</h2>

      <div className="space-y-1 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-slate-500">
            [Waiting for analysis to start...]
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="terminal-line">
              <span className={`font-semibold ${getAgentColor(log.agent)}`}>
                [{log.agent}]
              </span>
              <span className="text-slate-300 ml-2">{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div ref={endRef} />
    </div>
  );
}
