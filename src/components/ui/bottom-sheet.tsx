"useclient";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string; // e.g. "85vh"
  showCloseButton?: boolean;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "85vh",
  showCloseButton = true,
  className = "",
  closeOnBackdropClick = true,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Koordinat drag
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Sinkronisasi render lifecycle & animasi
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Timeout frame mikro agar transisi CSS terpicu
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTranslateY(0);
      }, 20);
      document.body.style.overflow = "hidden";
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setTranslateY(0);
      }, 300); // Sesuai durasi transisi
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Drag Start (Touch)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  };

  // Handle Drag Move (Touch)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    currentYRef.current = currentY;
    const deltaY = currentY - startYRef.current;

    // Hanya drag ke bawah (nilai positif)
    if (deltaY > 0) {
      setTranslateY(deltaY);
    } else {
      // Efek elastisitas jika ditarik ke atas
      setTranslateY(deltaY * 0.2);
    }
  };

  // Handle Drag End (Touch)
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const elapsedTime = Date.now() - startTimeRef.current;
    const velocity = deltaY / elapsedTime;

    // Tutup jika ditarik lebih dari 100px atau disentak dengan cepat ke bawah
    if (deltaY > 100 || (velocity > 0.5 && deltaY > 40)) {
      onClose();
    } else {
      // Kembali ke posisi semula
      setTranslateY(0);
    }
  };

  // Handle Mouse Drag (untuk desktop / testing di devtools)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentY = moveEvent.clientY;
      currentYRef.current = currentY;
      const deltaY = currentY - startYRef.current;
      if (deltaY > 0) {
        setTranslateY(deltaY);
      } else {
        setTranslateY(deltaY * 0.2);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      const deltaY = currentYRef.current - startYRef.current;
      if (deltaY > 100) {
        onClose();
      } else {
        setTranslateY(0);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  if (!isRendered) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop Overlay dengan Blur */}
      <div
        onClick={() => closeOnBackdropClick && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(17, 17, 14, 0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: isAnimating ? 1 : 0,
          transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Kontainer Lembar Bawah (Bottom Sheet Sheet Container) */}
      <div
        ref={sheetRef}
        className={`bottom-sheet-container ${className}`}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "540px",
          margin: "0 auto",
          backgroundColor: "var(--lp-surface, #FAFAFA)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.18)",
          maxHeight: maxHeight,
          display: "flex",
          flexDirection: "column",
          transform: isAnimating ? `translate3d(0, ${translateY}px, 0)` : "translate3d(0, 100%, 0)",
          transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          borderBottom: "none",
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        {/* Drag Handle Area (Touch & Mouse Grabber) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{
            padding: "12px 16px 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "grab",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* Pill Indicator */}
          <div
            style={{
              width: "48px",
              height: "5px",
              backgroundColor: "rgba(31, 75, 93, 0.25)",
              borderRadius: "999px",
              marginBottom: "8px",
              transition: "background-color 200ms ease",
            }}
          />

          {/* Header Title & Close Button */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--lp-text, #1F1E19)" }}>
              {title}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Lembar"
                style={{
                  background: "rgba(31, 75, 93, 0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--lp-ocean-blue, #1F4B5D)",
                  cursor: "pointer",
                  transition: "background 200ms ease",
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Sheet Content (Scrollable) */}
        <div
          style={{
            padding: "12px 20px 24px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            flex: 1,
            touchAction: "pan-y",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
