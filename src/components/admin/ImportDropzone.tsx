"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, X, AlertCircle } from "lucide-react";

interface ImportDropzoneProps {
  type: "groups" | "users";
  onFileSelected: (file: File) => void;
  onClearFile: () => void;
  selectedFile: File | null;
  loading: boolean;
  templateDownloadUrl: string;
}

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({
  type,
  onFileSelected,
  onClearFile,
  selectedFile,
  loading,
  templateDownloadUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndSelectFile = (file: File) => {
    setDragError(null);
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setDragError("Format file tidak didukung. Mohon unggah file .xlsx, .xls, atau .csv.");
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ width: "100%", marginBottom: "22px" }}>
      {/* Header bar dengan tombol Download Template */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "14px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F4B5D", margin: 0 }}>
            Unggah Berkas Excel {type === "groups" ? "Master Kelompok" : "Master Pengguna"}
          </h3>
          <p style={{ fontSize: "0.78rem", color: "rgba(31, 75, 93, 0.75)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
            {type === "groups"
              ? "Format kolom: nama_kelompok, deskripsi"
              : "Format kolom: nama, nim, username, role, fakultas, prodi, nama_kelompok, password_default"}
          </p>
        </div>

        <a
          href={templateDownloadUrl}
          download
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "12px",
            backgroundColor: "#ECFDF5",
            color: "#047857",
            border: "1.5px solid #A7F3D0",
            fontSize: "0.8rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(4, 120, 87, 0.08)",
            flexShrink: 0,
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
        >
          <Download size={15} />
          <span>Download Template (.xlsx)</span>
        </a>
      </div>

      {/* Area Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: selectedFile ? "20px 24px" : "36px 24px",
          borderRadius: "20px",
          border: isDragOver
            ? "2.5px dashed #0F766E"
            : selectedFile
            ? "2px solid rgba(15, 118, 110, 0.3)"
            : "2px dashed rgba(31, 75, 93, 0.25)",
          backgroundColor: isDragOver
            ? "rgba(15, 118, 110, 0.08)"
            : selectedFile
            ? "rgba(15, 118, 110, 0.03)"
            : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 18px rgba(0, 0, 0, 0.03)",
          cursor: loading ? "wait" : "pointer",
          userSelect: "none",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
          disabled={loading}
        />

        {selectedFile ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "#FFFFFF",
              padding: "14px 18px",
              borderRadius: "16px",
              border: "1.5px solid rgba(15, 118, 110, 0.2)",
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", overflow: "hidden" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#ECFDF5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileSpreadsheet size={24} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <p
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    color: "#1F4B5D",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "3px 0 0 0" }}>
                  {formatFileSize(selectedFile.size)} • Siap diproses
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.value = "";
                onClearFile();
              }}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "10px",
                color: "#94A3B8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s ease",
              }}
              title="Ganti File"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "18px",
                backgroundColor: "rgba(15, 118, 110, 0.1)",
                color: "#0F766E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <UploadCloud size={32} />
            </div>
            <p style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F4B5D", margin: "0 0 4px 0" }}>
              Tarik &amp; letakkan file Excel di sini, atau{" "}
              <span style={{ color: "#0F766E", textDecoration: "underline", cursor: "pointer" }}>
                Pilih Berkas
              </span>
            </p>
            <p style={{ fontSize: "0.76rem", color: "#64748B", margin: 0 }}>
              Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> (Maksimal 10MB)
            </p>
          </div>
        )}

        {dragError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "12px",
              fontSize: "0.75rem",
              color: "#DC2626",
              fontWeight: 600,
            }}
          >
            <AlertCircle size={15} />
            <span>{dragError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
