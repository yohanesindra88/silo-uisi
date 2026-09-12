import React from "react";
import { Crown, Award, ShieldCheck, Gem, Radio } from "lucide-react";
import { getCloudinaryUrl } from "@/utils/cloudinary";

interface SponsorItem {
  name: string;
  category: string;
  logoSrc: string;
}

const PLATINUM_SPONSORS: SponsorItem[] = [
  {
    name: "PT Semen Indonesia (Persero) Tbk (SIG)",
    category: "Main Platinum Sponsor",
    logoSrc: "/sponsors/sig.webp",
  },
  {
    name: "Bank Mandiri",
    category: "Official Banking Partner",
    logoSrc: "/sponsors/mandiri.webp",
  },
];

const GOLD_SPONSORS: SponsorItem[] = [
  {
    name: "Telkomsel",
    category: "Telecommunication Partner",
    logoSrc: "/sponsors/telkomsel.svg",
  },
  {
    name: "Indofood",
    category: "Food & Beverage Partner",
    logoSrc: "/sponsors/indofood.svg",
  },
  {
    name: "Kahf Official",
    category: "Grooming Partner",
    logoSrc: "/sponsors/kahf.svg",
  },
];

const SILVER_SPONSORS: SponsorItem[] = [
  {
    name: "Teh Botol Sosro",
    category: "Beverage Partner",
    logoSrc: "/sponsors/sosro.svg",
  },
  {
    name: "Le Minerale",
    category: "Mineral Water Partner",
    logoSrc: "/sponsors/leminerale.svg",
  },
  {
    name: "Grab Indonesia",
    category: "Mobility Partner",
    logoSrc: "/sponsors/grab.svg",
  },
  {
    name: "Gojek Indonesia",
    category: "Superapp Partner",
    logoSrc: "/sponsors/gojek.svg",
  },
];

const MEDIA_PARTNERS: { name: string; category: string }[] = [
  {
    name: "UISI Media Center",
    category: "Campus Official Media",
  },
  {
    name: "Event Surabaya & Gresik",
    category: "Regional Event Partner",
  },
  {
    name: "Info Kampus Indonesia",
    category: "Education Media",
  },
  {
    name: "Mahasiswa Surabaya",
    category: "Student Community",
  },
];

export default function SponsorSection() {
  return (
    <section
      id="sponsor"
      style={{
        padding: "clamp(4rem, 7vw, 7rem) clamp(1rem, 5vw, 2rem)",
        background: "transparent",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              fontWeight: 800,
              color: "#1A1A1A",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Mitra &amp; <span style={{ background: "linear-gradient(135deg, var(--lp-ocean-blue), var(--lp-aqua))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sponsor AETHERA SILO UISI 2026</span>
          </h2>

          <p
            style={{
              color: "var(--lp-text-muted)",
              fontSize: "1rem",
              maxWidth: "620px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Terima kasih kepada para mitra dan perusahaan terkemuka yang mendukung kesuksesan seluruh rangkaian kegiatan AETHERA SILO UISI 2026.
          </p>
        </div>

        {/* ================= 💎 PLATINUM SPONSOR (BESAR) ================= */}
        <div style={{ marginBottom: "4.5rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #1f4b5d 0%, #0F172A 100%)",
              color: "#E2E8F0",
              padding: "0.4rem 1.1rem",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "2.5rem",
              boxShadow: "0 4px 15px rgba(31,75,93,0.2)",
            }}
          >
            <span><Gem size={15} style={{ verticalAlign: "middle" }} /></span> PLATINUM SPONSOR
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "3.5rem 6rem",
            }}
          >
            {PLATINUM_SPONSORS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  transition: "transform 0.3s ease",
                }}
              >
                {/* Logo Besar Platinum (Height ~70px) */}
                <img
                  src={getCloudinaryUrl(item.logoSrc)}
                  alt={item.name}
                  style={{
                    height: "70px",
                    width: "auto",
                    maxWidth: "240px",
                    objectFit: "contain",
                    marginBottom: "0.75rem",
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.06))",
                  }}
                />

                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "#0F172A",
                    marginBottom: "0.15rem",
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#64748B",
                  }}
                >
                  {item.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(0,0,0,0.06)",
            maxWidth: "800px",
            margin: "0 auto 4rem",
          }}
        />

        {/* ================= 🥇 GOLD SPONSOR (SEDANG) ================= */}
        <div style={{ marginBottom: "4.5rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(217, 119, 6, 0.12)",
              color: "#B45309",
              padding: "0.35rem 0.95rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "2rem",
            }}
          >
            <span><Award size={15} style={{ verticalAlign: "middle" }} /></span> GOLD SPONSOR
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "2.5rem 4.5rem",
            }}
          >
            {GOLD_SPONSORS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {/* Logo Sedang Gold (Height ~48px) */}
                <img
                  src={getCloudinaryUrl(item.logoSrc)}
                  alt={item.name}
                  style={{
                    height: "48px",
                    width: "auto",
                    maxWidth: "180px",
                    objectFit: "contain",
                    marginBottom: "0.6rem",
                  }}
                />

                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    color: "#1E293B",
                    marginBottom: "0.1rem",
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    color: "#64748B",
                  }}
                >
                  {item.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(0,0,0,0.06)",
            maxWidth: "800px",
            margin: "0 auto 4rem",
          }}
        />

        {/* ================= 🥈 SILVER SPONSOR (KECIL) ================= */}
        <div style={{ marginBottom: "4.5rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(100, 116, 139, 0.12)",
              color: "#475569",
              padding: "0.35rem 0.95rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "1.75rem",
            }}
          >
            <span><ShieldCheck size={15} style={{ verticalAlign: "middle" }} /></span> SILVER SPONSOR
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem 3rem",
            }}
          >
            {SILVER_SPONSORS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {/* Logo Kecil Silver (Height ~32px) */}
                <img
                  src={getCloudinaryUrl(item.logoSrc)}
                  alt={item.name}
                  style={{
                    height: "34px",
                    width: "auto",
                    maxWidth: "140px",
                    objectFit: "contain",
                    marginBottom: "0.4rem",
                    opacity: 0.9,
                  }}
                />

                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "0.1rem",
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#94A3B8",
                  }}
                >
                  {item.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(0,0,0,0.06)",
            maxWidth: "800px",
            margin: "0 auto 4rem",
          }}
        />

        {/* ================= 📻 MEDIA PARTNER ================= */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(31, 75, 93, 0.08)",
              color: "#1f4b5d",
              padding: "0.35rem 0.95rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "1.75rem",
            }}
          >
            <span><Radio size={15} style={{ verticalAlign: "middle" }} /></span> MEDIA PARTNER
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "2rem 3rem",
              alignItems: "center",
            }}
          >
            {MEDIA_PARTNERS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", color: "#1f4b5d" }}>
                  <Radio size={18} />
                </span>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      color: "#1E293B",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#64748B",
                      marginTop: "0.1rem",
                    }}
                  >
                    {item.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
