"use client";

import React, { useState, useMemo } from "react";
import { Search, Edit3, Trash2, Layers, Users } from "lucide-react";
import { GroupEditData } from "./DbEditModal";

export interface DbGroupItem extends GroupEditData {
  createdAt?: string;
  users?: Array<{ id: number; nama: string; role?: string }>;
  mentors?: Array<{
    mUsersId: number;
    user: { id: number; nama: string; username: string };
  }>;
}

interface DbGroupsTableProps {
  groups: DbGroupItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onClearSelection: () => void;
  onEdit: (group: DbGroupItem) => void;
  onDelete: (group: DbGroupItem) => void;
  isAdmin: boolean;
}

export const DbGroupsTable: React.FC<DbGroupsTableProps> = ({
  groups,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (g.name || "").toLowerCase().includes(q);
        const matchDesc = (g.description || "").toLowerCase().includes(q);
        const matchMentor = (g.mentors || []).some((m) =>
          (m.user?.nama || "").toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchMentor) return false;
      }
      return true;
    });
  }, [groups, searchQuery]);

  const filteredIds = useMemo(() => filteredGroups.map((g) => g.id), [filteredGroups]);
  const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const isSomeSelected = filteredIds.some((id) => selectedIds.has(id)) && !isAllSelected;

  const handleHeaderCheckboxChange = () => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onSelectAll(filteredIds);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          backgroundColor: "#FFFFFF",
          padding: "12px 16px",
          borderRadius: "16px",
          border: "1px solid rgba(31, 75, 93, 0.12)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "240px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#F9FAFB",
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
          }}
        >
          <Search size={16} color="#6B7280" />
          <input
            type="text"
            placeholder="Cari nama kelompok, mentor, deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.82rem",
              width: "100%",
              fontWeight: 500,
            }}
          />
        </div>

        <div style={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 600 }}>
          {filteredGroups.length} kelompok ditemukan
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid rgba(31, 75, 93, 0.12)",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.82rem",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(31, 75, 93, 0.05)",
                  borderBottom: "1.5px solid rgba(31, 75, 93, 0.12)",
                  color: "#1F4B5D",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {isAdmin && (
                  <th style={{ padding: "12px 14px", width: "42px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleHeaderCheckboxChange}
                      title="Pilih Semua"
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#1F4B5D" }}
                    />
                  </th>
                )}
                <th style={{ padding: "12px 14px" }}>Nama Kelompok</th>
                <th style={{ padding: "12px 14px" }}>Deskripsi</th>
                <th style={{ padding: "12px 14px" }}>Jumlah Mahasiswa</th>
                <th style={{ padding: "12px 14px" }}>Mentor Pendamping</th>
                {isAdmin && <th style={{ padding: "12px 14px", textAlign: "center", width: "130px" }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    style={{
                      padding: "36px",
                      textAlign: "center",
                      color: "#6B7280",
                      fontSize: "0.85rem",
                    }}
                  >
                    Tidak ada data kelompok yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => {
                  const isChecked = selectedIds.has(g.id);
                  const memberCount = (g.users || []).filter(
                    (u) => !u.role || u.role.toLowerCase() === "maba"
                  ).length;
                  const mentorNames = (g.mentors || []).map((m) => m.user?.nama).filter(Boolean);

                  return (
                    <tr
                      key={g.id}
                      style={{
                        borderBottom: "1px solid #F3F4F6",
                        backgroundColor: isChecked ? "rgba(104, 207, 235, 0.08)" : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* Checkbox */}
                      {isAdmin && (
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleSelect(g.id)}
                            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#1F4B5D" }}
                          />
                        </td>
                      )}

                      {/* Nama Kelompok */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(15, 118, 110, 0.1)",
                              color: "#0F766E",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Layers size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#1F4B5D", fontSize: "0.88rem" }}>
                              {g.name}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                              Kelompok ID #{g.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Deskripsi */}
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ color: g.description ? "#374151" : "#9CA3AF", fontSize: "0.78rem" }}>
                          {g.description || "- Tidak ada deskripsi -"}
                        </span>
                      </td>

                      {/* Jumlah Mahasiswa */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "8px",
                            backgroundColor: memberCount > 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
                            color: memberCount > 0 ? "#059669" : "#6B7280",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        >
                          <Users size={12} />
                          <span>{memberCount} Mahasiswa Baru</span>
                        </span>
                      </td>

                      {/* Mentor Pendamping */}
                      <td style={{ padding: "12px 14px" }}>
                        {mentorNames.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {mentorNames.map((name, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                  backgroundColor: "rgba(14, 165, 233, 0.1)",
                                  color: "#0284C7",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>- Belum Ada Mentor -</span>
                        )}
                      </td>

                      {/* Aksi */}
                      {isAdmin && (
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => onEdit(g)}
                              title="Edit Kelompok"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 10px",
                                borderRadius: "8px",
                                border: "1px solid rgba(31, 75, 93, 0.2)",
                                backgroundColor: "#FFFFFF",
                                color: "#1F4B5D",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(g)}
                              title="Hapus Kelompok"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 10px",
                                borderRadius: "8px",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                backgroundColor: "rgba(239, 68, 68, 0.05)",
                                color: "#DC2626",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
