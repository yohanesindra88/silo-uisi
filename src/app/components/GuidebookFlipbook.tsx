"use client";

import React, { useEffect, useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import styles from "./GuidebookSection.module.css";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Download 
} from "lucide-react";

// Configure local worker path for pdfjs-dist v3
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

interface PageProps {
  pageNumber: number;
  imageSrc: string;
}

// React.forwardRef is strictly required by react-pageflip
const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  return (
    <div className={styles.pageItem} ref={ref}>
      <div className={styles.pageInner}>
        <img
          src={props.imageSrc}
          alt={`Guidebook Halaman ${props.pageNumber}`}
          className={styles.pageImg}
          loading="eager"
        />
        <div className={styles.pageFooterBadge}>
          <span>{props.pageNumber}</span>
        </div>
      </div>
    </div>
  );
});

Page.displayName = "Page";

interface GuidebookFlipbookProps {
  pdfUrl?: string;
}

export default function GuidebookFlipbook({ pdfUrl = "/guidebook.pdf" }: GuidebookFlipbookProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(600);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentRect.height > 0) {
            setViewportHeight(entry.contentRect.height);
          }
        }
      });
      resizeObserver.observe(viewportRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setErrorMsg(null);
        setProgress(5);

        // Fetch PDF binary data directly to ensure reliable loading
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Gagal mengunduh PDF (HTTP ${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;
        setProgress(20);

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const numPages = pdf.numPages;
        setTotalPages(numPages);

        const renderedPages: string[] = [];

        // 1. Render Page 1 IMMEDIATELY & hide loading screen instantly
        const page1 = await pdf.getPage(1);
        const viewport1 = page1.getViewport({ scale: 1.5 });
        const canvas1 = document.createElement("canvas");
        const context1 = canvas1.getContext("2d");

        if (context1) {
          canvas1.height = viewport1.height;
          canvas1.width = viewport1.width;

          await page1.render({
            canvasContext: context1,
            viewport: viewport1,
            canvas: canvas1,
          } as any).promise;

          renderedPages.push(canvas1.toDataURL("image/jpeg", 0.9));
          setPages([...renderedPages]);
          setLoading(false);
        }

        // 2. Render remaining pages silently in the background
        for (let i = 2; i <= numPages; i++) {
          if (isCancelled) return;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
              canvasContext: context,
              viewport: viewport,
              canvas: canvas,
            } as any).promise;

            renderedPages.push(canvas.toDataURL("image/jpeg", 0.9));
            setPages([...renderedPages]);
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat PDF guidebook:", err);
        if (!isCancelled) {
          setErrorMsg(err?.message || "Terjadi kesalahan saat memproses dokumen PDF.");
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  const handlePrevPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  const handleNextPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const handlePageFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 1.6));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.8));
  };

  const getViewportTransform = () => {
    if (isMobile) {
      return `scale(${zoomLevel})`;
    }
    let translateX = 0;
    if (!isMobile) {
      if (currentPage === 0) {
        translateX = -210;
      } else if (currentPage >= totalPages - 1 && totalPages > 0) {
        translateX = 210;
      }
    }
    return `scale(${zoomLevel}) translateX(${translateX}px)`;
  };

  return (
    <div className={styles.flipbookWrapper} ref={containerRef}>
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>
            Memuat Dokumen PDF Guidebook ({progress}%)
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : errorMsg ? (
        <div className={styles.loadingContainer}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <div className={styles.loadingText} style={{ color: "#ef4444" }}>
            {errorMsg}
          </div>
          <button
            className={styles.downloadBtn}
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem" }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Flipbook Container */}
          <div
            ref={viewportRef}
            className={styles.bookViewport}
            style={{
              transform: getViewportTransform(),
              transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              transformOrigin: "top center",
              marginBottom: zoomLevel > 1 ? `${viewportHeight * (zoomLevel - 1)}px` : '0px'
            }}
          >
            {/* @ts-ignore */}
            <HTMLFlipBook
              width={isMobile ? 310 : 420}
              height={isMobile ? 438 : 593}
              size="stretch"
              minWidth={260}
              maxWidth={500}
              minHeight={360}
              maxHeight={706}
              drawShadow={true}
              maxShadowOpacity={0.3}
              showCover={true}
              usePortrait={isMobile}
              mobileScrollSupport={true}
              onFlip={handlePageFlip}
              ref={flipBookRef}
              className={styles.flipBook}
            >
              {pages.map((imgSrc, idx) => (
                <Page key={idx} pageNumber={idx + 1} imageSrc={imgSrc} />
              ))}
            </HTMLFlipBook>
          </div>

          {/* Controls Footer */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarGroup}>
              <button
                className={styles.toolBtnIcon}
                onClick={handlePrevPage}
                title="Halaman Sebelumnya"
                disabled={currentPage === 0}
              >
                <ChevronLeft size={18} />
              </button>

              <div className={styles.pageInfoBadge}>
                <span>Halaman</span>
                <strong className={styles.pageInfoNum}>{currentPage + 1}</strong>
                <span className={styles.pageInfoSeparator}>/</span>
                <strong className={styles.pageInfoTotal}>{totalPages}</strong>
              </div>

              <button
                className={styles.toolBtnIcon}
                onClick={handleNextPage}
                title="Halaman Selanjutnya"
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className={styles.toolbarDivider} />

            <div className={styles.toolbarGroup}>
              <button
                className={styles.toolBtnIcon}
                onClick={handleZoomOut}
                title="Perkecil"
                disabled={zoomLevel <= 0.8}
              >
                <ZoomOut size={16} />
              </button>
              <span 
                className={styles.zoomBadge}
                onClick={() => setZoomLevel(1)}
                title="Klik untuk kembali ke ukuran asli"
                style={{ cursor: "pointer" }}
              >
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                className={styles.toolBtnIcon}
                onClick={handleZoomIn}
                title="Perbesar"
                disabled={zoomLevel >= 1.6}
              >
                <ZoomIn size={16} />
              </button>
              <button
                className={styles.toolBtnIcon}
                onClick={toggleFullscreen}
                title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <a
                href={pdfUrl}
                download="GUIDEBOOK_BRANARA_SILO_UISI_2025.pdf"
                className={styles.downloadBtn}
                title="Unduh PDF Asli"
              >
                <Download size={15} />
                <span>Unduh PDF</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
