"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ImagePlus, Trash2, RefreshCw } from "lucide-react";

interface DocRow {
  id: string;
  src: string;
  title: string;
  tag: string;
}

/**
 * Kelola galeri dokumentasi (admin & panitia).
 *
 * Gambar diunggah ke penyimpanan server sendiri lewat POST /api/media dengan
 * purpose=site, lalu URL hasilnya disimpan di tabel m_documentations.
 */
export default function AdminDokumentasiPage() {
  const [items, setItems] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tidak memanggil setState secara sinkron di sini: pemanggil pertama adalah
  // useEffect, dan setState sinkron di dalam effect memicu render berantai.
  // Indikator loading awal sudah ditangani nilai awal state.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dokumentasi");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch {
      setFeedback({ type: "error", msg: "Gagal memuat galeri." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setFeedback(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "site");

      const res = await fetch("/api/media", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setFeedback({ type: "error", msg: json.message || "Gagal mengunggah gambar." });
        return;
      }

      setImageUrl(json.data.url);
      setThumbnail(json.data.variants?.["600"] || json.data.url);
    } catch {
      setFeedback({ type: "error", msg: "Gagal menghubungi server." });
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !title.trim() || !tag.trim()) {
      setFeedback({ type: "error", msg: "Gambar, judul, dan tag wajib diisi." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/dokumentasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, title: title.trim(), tag: tag.trim() }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setFeedback({ type: "error", msg: json.message || "Gagal menyimpan." });
        return;
      }

      setFeedback({ type: "success", msg: "Item galeri ditambahkan." });
      setTitle("");
      setTag("");
      setImageUrl("");
      setThumbnail("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus item galeri ini?")) return;

    const res = await fetch(`/api/dokumentasi/${id}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setFeedback({ type: "error", msg: json.message || "Gagal menghapus." });
      return;
    }
    setFeedback({ type: "success", msg: "Item galeri dihapus." });
    await load();
  };

  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1F4B5D", marginBottom: 4 }}>
        Galeri Dokumentasi
      </h1>
      <p style={{ fontSize: "0.85rem", color: "rgba(31,75,93,0.7)", marginBottom: 20 }}>
        Gambar yang ditambahkan di sini langsung tampil pada halaman utama dan halaman galeri.
      </p>

      {feedback && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 16,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: feedback.type === "success" ? "#059669" : "#DC2626",
            backgroundColor: feedback.type === "success" ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)",
          }}
        >
          {feedback.msg}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(31,75,93,0.15)",
          marginBottom: 28,
        }}
      >
        <strong style={{ fontSize: "0.9rem", color: "#1F4B5D" }}>Tambah Item Baru</strong>

        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt="Pratinjau"
            style={{ width: 180, height: 120, objectFit: "cover", borderRadius: 10 }}
          />
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px dashed rgba(31,75,93,0.35)",
              fontSize: "0.8rem",
            }}
          />
        )}
        {uploading && <span style={{ fontSize: "0.75rem", color: "#1F4B5D" }}>Mengunggah…</span>}

        <input
          placeholder="Judul dokumentasi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(31,75,93,0.2)", fontSize: "0.85rem" }}
        />
        <input
          placeholder="Tag (mis. Euforia Maba)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(31,75,93,0.2)", fontSize: "0.85rem" }}
        />

        <button
          type="submit"
          disabled={saving || uploading || !imageUrl}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            backgroundColor: !imageUrl || saving ? "rgba(31,75,93,0.4)" : "#1F4B5D",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: !imageUrl || saving ? "not-allowed" : "pointer",
          }}
        >
          <ImagePlus size={16} />
          {saving ? "Menyimpan…" : "Tambahkan ke Galeri"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <strong style={{ fontSize: "0.9rem", color: "#1F4B5D" }}>Item Saat Ini ({items.length})</strong>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 8,
            border: "1px solid rgba(31,75,93,0.2)",
            backgroundColor: "#FFFFFF",
            fontSize: "0.7rem",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} /> Muat ulang
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: "0.85rem", color: "rgba(31,75,93,0.7)" }}>Memuat…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(31,75,93,0.15)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src.replace(/\.(w\d+|orig)\.webp$/i, ".w600.webp")}
                alt={item.title}
                style={{ width: "100%", height: 130, objectFit: "cover" }}
              />
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F4B5D" }}>{item.title}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(31,75,93,0.6)", marginBottom: 8 }}>{item.tag}</div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 9px",
                    borderRadius: 8,
                    border: "1px solid rgba(220,38,38,0.3)",
                    backgroundColor: "#FFFFFF",
                    color: "#DC2626",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
