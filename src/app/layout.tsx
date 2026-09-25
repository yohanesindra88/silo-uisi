import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1F4B5D",
};

export const metadata: Metadata = {
  title: "AETHERA SILO UISI 2026",
  description: "Portal Resmi AETHERA SILO UISI 2026 — Universitas Internasional Semen Indonesia",
  icons: {
    icon: "/logo_aethera.png?v=99",
    shortcut: "/logo_aethera.png?v=99",
    apple: "/apple-icon.png",
  },
  other: {
    google: "notranslate",
  },
};

import AosInit from "./components/AosInit";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" translate="no" className="notranslate" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AosInit />
        {children}
      </body>
    </html>
  );
}
