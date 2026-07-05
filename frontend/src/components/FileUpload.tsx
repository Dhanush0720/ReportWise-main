"use client";

import React, { useState } from "react";

interface FileUploadProps {
  onFileChange: (fileName: string) => void;
}

const SUPPORTED_FORMATS = [
  "CSV", "Excel", "JSON", "Parquet", "HDF5", "ZIP"
];

export default function FileUpload({ onFileChange }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [fileFormat, setFileFormat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    onFileChange(file.name);
    
    // Detect file format
    const ext = file.name.split('.').pop()?.toLowerCase();
    detectFormat(ext);
    
    // For CSV/text, show preview
    if (["csv", "txt", "json"].includes(ext || "")) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").slice(0, 6);
          const rows = lines.map((line) => 
            line.split(/[,\t]/).slice(0, 5)
          );
          setPreview(rows);
        } catch (err) {
          console.error("Preview parse error:", err);
        }
        setLoading(false);
      };
      reader.readAsText(file);
    } else {
      setPreview([]);
    }
  };

  const detectFormat = (ext: string | undefined) => {
    if (!ext) {
      setFileFormat("Unknown");
      return;
    }
    
    const formatMap: { [key: string]: string } = {
      csv: "CSV",
      xlsx: "Excel",
      xls: "Excel",
      json: "JSON",
      parquet: "Parquet",
      h5: "HDF5",
      hdf5: "HDF5",
      zip: "ZIP Archive",
      txt: "Text",
    };
    
    setFileFormat(formatMap[ext] || "Unknown");
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-2">📁 Upload Data File</h2>
      <p className="text-sm text-slate-400 mb-4">
        Supported: {SUPPORTED_FORMATS.join(", ")}
      </p>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          dragActive
            ? "border-blue-400 bg-blue-950"
            : "border-slate-600 hover:border-slate-500"
        }`}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json,.parquet,.h5,.hdf5,.zip,.txt"
          onChange={handleChange}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <p className="text-slate-300 mb-2">
            Drag and drop your data file here, or click to browse
          </p>
          <p className="text-sm text-slate-500">
            (CSV, Excel, JSON, Parquet, HDF5, ZIP, Text)
          </p>
        </label>
      </div>

      {fileName && (
        <div className="mt-4 p-4 bg-slate-700 rounded">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-slate-400">
              📄 {fileName}
            </p>
            {fileFormat && (
              <span className="text-xs px-2 py-1 bg-blue-600 text-blue-100 rounded">
                {fileFormat}
              </span>
            )}
          </div>
          
          {loading && (
            <p className="text-xs text-slate-400">Loading preview...</p>
          )}
          
          {preview.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="text-xs text-slate-300">
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 border border-slate-600">
                          {cell.substring(0, 15)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
