"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Edit3, Trash2, Users, Shield, GraduationCap, Layers, RotateCcw } from "lucide-react";
import { UserEditData } from "./DbEditModal";

export interface DbUserItem extends UserEditData {
  createdAt?: string;
  qrToken?: string | null;
}

interface DbUsersTableProps {
  users: DbUserItem[];
  groups?: Array<{ id: number; name: string }>;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onClearSelection: () => void;
  onEdit: (user: DbUserItem) => void;
  onDelete: (user: DbUserItem) => void;
  isAdmin: boolean;
}

export const DbUsersTable: React.FC<DbUsersTableProps> = ({
  users,
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
  const [roleFilter, setRoleFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  // Hitung jumlah masing-masing role sesuai dengan database (maba, mentor, admin)
  const roleCounts = useMemo(() => {
    let maba = 0;
    let mentor = 0;
    let admin = 0;

    users.forEach((u) => {
      const r = (u.role || "").toLowerCase();
      if (r === "maba") maba++;
      else if (r === "mentor") mentor++;
      else if (r === "admin" || r === "panitia") admin++;
    });

    return {
      maba,
      mentor,
      admin,
    };
  }, [users]);

  // Daftar opsi kelompok dari prop groups dan users
  const groupOptions = useMemo(() => {
    const map = new Map<number, string>();
    if (groups && groups.length > 0) {
      groups.forEach((g) => {
        if (g.id && g.name) map.set(g.id, g.name);
      });
    }
    users.forEach((u) => {
      if (u.group?.id && u.group?.name) {
        map.set(u.group.id, u.group.name);
      }
      u.groupMentors?.forEach((gm) => {
        if (gm.group?.id && gm.group?.name) {
          map.set(gm.group.id, gm.group.name);
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, users]);

  const unassignedCount = useMemo(() => {
    return users.filter(
      (u) => !u.mGroupsId && !u.group?.id && (!u.groupMentors || u.groupMentors.length === 0)
    ).length;
  }, [users]);

  // Filter users berdasarkan search query, role, dan kelompok
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const uRole = (u.role || "").toLowerCase();

      // 1. Role Filter
      if (roleFilter !== "all") {
        if (roleFilter === "maba" && uRole !== "maba") return false;
        if (roleFilter === "mentor" && uRole !== "mentor") return false;
        if (roleFilter === "admin" && uRole !== "admin" && uRole !== "panitia") return false;
      }

      // 2. Group Filter
      if (groupFilter !== "all") {
        if (groupFilter === "none") {
          const hasGroup = Boolean(
            u.mGroupsId || u.group?.id || (u.groupMentors && u.groupMentors.length > 0)
          );
          if (hasGroup) return false;
        } else {
          const targetGroupId = Number(groupFilter);
          const matchDirect = u.mGroupsId === targetGroupId || u.group?.id === targetGroupId;
          const matchMentor = (u.groupMentors || []).some(
            (gm) => gm.mGroupsId === targetGroupId || gm.group?.id === targetGroupId
          );
          if (!matchDirect && !matchMentor) return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = (u.nama || "").toLowerCase().includes(q);
        const matchNim = (u.nim || "").toLowerCase().includes(q);
        const matchUser = (u.username || "").toLowerCase().includes(q);
        const matchGroup =
          (u.group?.name || "").toLowerCase().includes(q) ||
          (u.groupMentors || []).some((gm) => (gm.group?.name || "").toLowerCase().includes(q));
        const matchProdi = (u.prodi || "").toLowerCase().includes(q);
        const matchFakultas = (u.fakultas || "").toLowerCase().includes(q);
        if (!matchNama && !matchNim && !matchUser && !matchGroup && !matchProdi && !matchFakultas) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, groupFilter, searchQuery]);

  const filteredIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const isSomeSelected = filteredIds.some((id) => selectedIds.has(id)) && !isAllSelected;

  const handleHeaderCheckboxChange = () => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onSelectAll(filteredIds);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r === "maba") {
      return {
        label: "Mahasiswa Baru",
        bg: "rgba(16, 185, 129, 0.12)",
        color: "#059669",
        icon: <GraduationCap size={12} />,
      };
    } else if (r === "mentor") {
      return {
        label: "Mentor",
        bg: "rgba(14, 165, 233, 0.12)",
        color: "#0284C7",
        icon: <Users size={12} />,
      };
    } else {
      return {
        label: "Admin",
        bg: "rgba(124, 58, 237, 0.12)",
        color: "#7C3AED",
        icon: <Shield size={12} />,
      };
    }
  };

  const isFilterActive =
    roleFilter !== "all" || groupFilter !== "all" || searchQuery.trim() !== "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Search & Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "#FFFFFF",
          padding: "12px 16px",
          borderRadius: "16px",
          border: "1px solid rgba(31, 75, 93, 0.12)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        }}
      >
        {/* Search Input */}
        <div
          style={{
            flex: 1,
            minWidth: "220px",
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
            placeholder="Cari nama, NIM, username, kelompok, prodi..."
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

        {/* Role Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={15} color="#1F4B5D" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(31, 75, 93, 0.2)",
              backgroundColor: "#FFFFFF",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#1F4B5D",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Peran ({users.length})</option>
            <option value="maba">Mahasiswa Baru ({roleCounts.maba})</option>
            <option value="mentor">Mentor ({roleCounts.mentor})</option>
            <option value="admin">Admin ({roleCounts.admin})</option>
          </select>
        </div>

        {/* Group Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Layers size={15} color="#0F766E" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(15, 118, 110, 0.25)",
              backgroundColor: "#FFFFFF",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#0F766E",
              outline: "none",
              cursor: "pointer",
              maxWidth: "220px",
            }}
          >
            <option value="all">Semua Kelompok ({users.length})</option>
            <option value="none">Tanpa Kelompok ({unassignedCount})</option>
            {groupOptions.map((g) => {
              const count = users.filter((u) => {
                const matchDirect = u.mGroupsId === g.id || u.group?.id === g.id;
                const matchMentor = (u.groupMentors || []).some(
                  (gm) => gm.mGroupsId === g.id || gm.group?.id === g.id
                );
                return matchDirect || matchMentor;
              }).length;
              return (
                <option key={g.id} value={String(g.id)}>
                  {g.name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Reset Filter Button */}
        {isFilterActive && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setGroupFilter("all");
            }}
            title="Reset Semua Filter"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              backgroundColor: "#F9FAFB",
              color: "#6B7280",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}

        <div style={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 600 }}>
          {filteredUsers.length} data ditemukan
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
                <th style={{ padding: "12px 14px" }}>Profil Pengguna</th>
                <th style={{ padding: "12px 14px" }}>Username</th>
                <th style={{ padding: "12px 14px" }}>Peran</th>
                <th style={{ padding: "12px 14px" }}>Kelompok</th>
                <th style={{ padding: "12px 14px" }}>Fakultas / Prodi</th>
                {isAdmin && <th style={{ padding: "12px 14px", textAlign: "center", width: "130px" }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    style={{
                      padding: "36px",
                      textAlign: "center",
                      color: "#6B7280",
                      fontSize: "0.85rem",
                    }}
                  >
                    Tidak ada data pengguna yang sesuai dengan filter atau kata kunci.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedIds.has(u.id);
                  const roleBadge = getRoleBadge(u.role);

                  return (
                    <tr
                      key={u.id}
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
                            onChange={() => onToggleSelect(u.id)}
                            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#1F4B5D" }}
                          />
                        </td>
                      )}

                      {/* Nama & NIM */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.85rem" }}>
                          {u.nama}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#6B7280" }}>
                          NIM: {u.nim || "-"}
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#1F4B5D",
                            backgroundColor: "rgba(31, 75, 93, 0.06)",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "0.76rem",
                          }}
                        >
                          {u.username}
                        </span>
                      </td>

                      {/* Peran */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            fontSize: "0.72rem",
                            fontWeight: 800,
                          }}
                        >
                          {roleBadge.icon}
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Kelompok */}
                      <td style={{ padding: "12px 14px" }}>
                        {u.group?.name ? (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(15, 118, 110, 0.1)",
                              color: "#0F766E",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            {u.group.name}
                          </span>
                        ) : u.groupMentors && u.groupMentors.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {u.groupMentors.map((gm, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "8px",
                                  backgroundColor: "rgba(14, 165, 233, 0.1)",
                                  color: "#0284C7",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {gm.group?.name || `Kelompok #${gm.mGroupsId}`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>- Tanpa Kelompok -</span>
                        )}
                      </td>

                      {/* Fakultas & Prodi */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#374151" }}>
                          {u.prodi || "-"}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                          {u.fakultas || "-"}
                        </div>
                      </td>

                      {/* Aksi */}
                      {isAdmin && (
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => onEdit(u)}
                              title="Edit Pengguna"
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
                              onClick={() => onDelete(u)}
                              title="Hapus Pengguna"
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
