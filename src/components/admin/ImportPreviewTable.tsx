"use client";

import React, { useState } from "react";
import { RowValidationResult, GroupImportRow, UserImportRow } from "@/controllers/import.controller";
import { CheckCircle2, AlertTriangle, XCircle, KeyRound, Pencil, Trash2 } from "lucide-react";

interface ImportPreviewTableProps {
  type: "groups" | "users";
  rows: RowValidationResult<GroupImportRow | UserImportRow>[];
  onEditRow?: (
    row: RowValidationResult<GroupImportRow | UserImportRow>,
    isExistingInDb: boolean
  ) => void;
  onDeleteRow?: (
    row: RowValidationResult<GroupImportRow | UserImportRow>,
    isExistingInDb: boolean
  ) => void;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  type,
  rows,
  onEditRow,
  onDeleteRow,
}) => {
  const [filter, setFilter] = useState<"all" | "valid" | "invalid">("all");

  const filteredRows = rows.filter((r) => {
    if (filter === "valid") return r.status === "VALID";
    if (filter === "invalid") return r.status === "ERROR" || r.status === "WARNING";
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(14px)",
        borderRadius: "20px",
        border: "1.5px solid rgba(31, 75, 93, 0.12)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        marginBottom: "22px",
      }}
    >
      {/* Table Header Filter Tabs */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(31, 75, 93, 0.08)",
          backgroundColor: "rgba(31, 75, 93, 0.02)",
        }}
      >
        <div>
          <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F4B5D", margin: 0 }}>
            Preview Baris Data ({filteredRows.length} dari {rows.length})
          </h4>
          <p style={{ fontSize: "0.76rem", color: "rgba(31, 75, 93, 0.7)", margin: "3px 0 0 0" }}>
            Tinjau baris data sebelum mengeksekusi commit penyimpanan ke database.
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(31, 75, 93, 0.08)",
            padding: "4px",
            borderRadius: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              backgroundColor: filter === "all" ? "#FFFFFF" : "transparent",
              color: filter === "all" ? "#1F4B5D" : "rgba(31, 75, 93, 0.8)",
              boxShadow: filter === "all" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Semua ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("valid")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              backgroundColor: filter === "valid" ? "#059669" : "transparent",
              color: filter === "valid" ? "#FFFFFF" : "#047857",
              boxShadow: filter === "valid" ? "0 2px 6px rgba(5,150,105,0.25)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Valid ({rows.filter((r) => r.status === "VALID").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("invalid")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              backgroundColor: filter === "invalid" ? "#DC2626" : "transparent",
              color: filter === "invalid" ? "#FFFFFF" : "#B91C1C",
              boxShadow: filter === "invalid" ? "0 2px 6px rgba(220,38,38,0.25)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Bermasalah ({rows.filter((r) => r.status !== "VALID").length})
          </button>
        </div>
      </div>

      {/* Table Scroll Area */}
      <div style={{ overflowX: "auto", maxHeight: "420px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem" }}>
          <thead
            style={{
              backgroundColor: "#F8FAFC",
              color: "#475569",
              textTransform: "uppercase",
              fontSize: "0.7rem",
              letterSpacing: "0.05em",
              fontWeight: 800,
              position: "sticky",
              top: 0,
              zIndex: 5,
              borderBottom: "1.5px solid #E2E8F0",
            }}
          >
            <tr>
              <th style={{ padding: "12px 14px", textAlign: "center", width: "55px" }}>Baris</th>
              <th style={{ padding: "12px 14px", width: "115px" }}>Status</th>
              {type === "groups" ? (
                <>
                  <th style={{ padding: "12px 14px" }}>Nama Kelompok</th>
                  <th style={{ padding: "12px 14px" }}>Deskripsi</th>
                </>
              ) : (
                <>
                  <th style={{ padding: "12px 14px" }}>Nama Lengkap</th>
                  <th style={{ padding: "12px 14px" }}>NIM</th>
                  <th style={{ padding: "12px 14px" }}>Username</th>
                  <th style={{ padding: "12px 14px" }}>Role</th>
                  <th style={{ padding: "12px 14px" }}>Kelompok</th>
                  <th style={{ padding: "12px 14px" }}>Password</th>
                </>
              )}
              <th style={{ padding: "12px 14px" }}>Validasi / Keterangan</th>
              <th style={{ padding: "12px 14px", textAlign: "center", width: "135px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={type === "groups" ? 6 : 10}
                  style={{ padding: "36px 16px", textAlign: "center", color: "#94A3B8", fontWeight: 600 }}
                >
                  Tidak ada data yang cocok dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const groupData = r.data as GroupImportRow;
                const userData = r.data as UserImportRow;
                const isExistingInDb =
                  r.status === "WARNING" &&
                  r.warnings.some(
                    (w) =>
                      w.toLowerCase().includes("sudah ada di database") ||
                      w.toLowerCase().includes("sudah terdaftar pada pengguna lain di database")
                  );

                const rowBg =
                  r.status === "ERROR"
                    ? "#FFF5F5"
                    : r.status === "WARNING"
                    ? "#FFFDF5"
                    : "#FFFFFF";

                return (
                  <tr
                    key={r.rowNumber}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: "1px solid #F1F5F9",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "center",
                        fontWeight: 800,
                        color: "#94A3B8",
                        fontSize: "0.78rem",
                      }}
                    >
                      #{r.rowNumber}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "12px 14px" }}>
                      {r.status === "VALID" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: "#D1FAE5",
                            color: "#065F46",
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>VALID</span>
                        </span>
                      )}
                      {r.status === "WARNING" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: "#FEF3C7",
                            color: "#92400E",
                          }}
                        >
                          <AlertTriangle size={13} />
                          <span>UPDATE</span>
                        </span>
                      )}
                      {r.status === "ERROR" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: "#FEE2E2",
                            color: "#991B1B",
                          }}
                        >
                          <XCircle size={13} />
                          <span>ERROR</span>
                        </span>
                      )}
                    </td>

                    {type === "groups" ? (
                      <>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1E293B" }}>
                          {groupData.nama_kelompok || (
                            <span style={{ color: "#EF4444", fontStyle: "italic" }}>(Kosong)</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748B", maxWidth: "260px" }}>
                          {groupData.deskripsi || <span style={{ color: "#CBD5E1" }}>-</span>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1E293B" }}>
                          {userData.nama || (
                            <span style={{ color: "#EF4444", fontStyle: "italic" }}>(Kosong)</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#475569" }}>
                          {userData.nim || <span style={{ color: "#CBD5E1" }}>-</span>}
                        </td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#0F766E", fontWeight: 600 }}>
                          {userData.username || (
                            <span style={{ color: "#EF4444", fontStyle: "italic" }}>(Kosong)</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              backgroundColor:
                                userData.role === "admin"
                                  ? "#F3E8FF"
                                  : userData.role === "mentor"
                                  ? "#E0F2FE"
                                  : "#DCFCE7",
                              color:
                                userData.role === "admin"
                                  ? "#6B21A8"
                                  : userData.role === "mentor"
                                  ? "#0369A1"
                                  : "#15803D",
                            }}
                          >
                            {userData.role}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#334155" }}>
                          {userData.nama_kelompok || (
                            <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Tanpa Kelompok</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {userData.password_default ? (
                            <span style={{ fontFamily: "monospace", color: "#334155" }}>
                              {userData.password_default}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.72rem",
                                color: "#0F766E",
                                fontWeight: 700,
                                backgroundColor: "rgba(15, 118, 110, 0.08)",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(15, 118, 110, 0.2)",
                              }}
                            >
                              <KeyRound size={12} />
                              Auto 6-digit
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Validasi / Error Log */}
                    <td style={{ padding: "12px 14px" }}>
                      {r.errors.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {r.errors.map((err, i) => (
                            <span
                              key={i}
                              style={{ color: "#DC2626", fontWeight: 700, fontSize: "0.74rem" }}
                            >
                              • {err}
                            </span>
                          ))}
                        </div>
                      )}

                      {r.warnings.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {r.warnings.map((warn, i) => (
                            <span
                              key={i}
                              style={{ color: "#D97706", fontSize: "0.74rem", fontWeight: 600 }}
                            >
                              • {warn}
                            </span>
                          ))}
                        </div>
                      )}

                      {r.errors.length === 0 && r.warnings.length === 0 && (
                        <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.76rem" }}>
                          Siap diimpor
                        </span>
                      )}
                    </td>

                    {/* Kolom Aksi (Hanya tampil untuk data yang berstatus UPDATE / sudah ada di DB) */}
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      {isExistingInDb ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => onEditRow?.(r, isExistingInDb)}
                            title="Edit data yang sudah ada di database ini"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              border: "1px solid rgba(15, 118, 110, 0.25)",
                              backgroundColor: "#F0FDFA",
                              color: "#0F766E",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteRow?.(r, isExistingInDb)}
                            title="Hapus data dari database atau antrean"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              border: "1px solid rgba(220, 38, 38, 0.3)",
                              backgroundColor: "#FEF2F2",
                              color: "#DC2626",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#CBD5E1", fontSize: "0.85rem", fontWeight: 600 }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
