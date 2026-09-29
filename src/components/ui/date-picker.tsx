"use client";

import React, { useRef, useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { formatDateInput, toDateInputValue, parseDateInput } from "@/utils/date";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Komponen DatePicker dengan format konsisten "DD/MM/YYYY" (Contoh: 29/09/2026).
 * Menyediakan textbox format DD/MM/YYYY serta icon kalender yang terintegrasi rapi.
 * Mengklik tombol kalender akan membuka picker kalender browser.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY (Contoh: 29/09/2026)",
  disabled = false,
  required = false,
  id,
  name,
  style,
  className,
}: DatePickerProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [textVal, setTextVal] = useState(() => formatDateInput(value));

  // Sinkronkan textVal saat value prop berubah dari luar
  useEffect(() => {
    setTextVal(formatDateInput(value));
  }, [value]);

  const nativeValue = toDateInputValue(value);

  // User memilih tanggal lewat popup kalender
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value; // YYYY-MM-DD
    if (!rawVal) {
      setTextVal("");
      onChange("");
      return;
    }
    setTextVal(formatDateInput(rawVal));
    onChange(rawVal);
  };

  // User mengetik langsung di textbox DD/MM/YYYY
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputStr = e.target.value;
    setTextVal(inputStr);

    const parsed = parseDateInput(inputStr);
    if (parsed) {
      onChange(toDateInputValue(parsed));
    } else if (!inputStr.trim()) {
      onChange("");
    }
  };

  // Saat blur, re-format jika valid
  const handleBlur = () => {
    if (value) {
      setTextVal(formatDateInput(value));
    }
  };

  const handleOpenPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (pickerRef.current) {
      try {
        if (typeof pickerRef.current.showPicker === "function") {
          pickerRef.current.showPicker();
        } else {
          pickerRef.current.focus();
        }
      } catch {
        pickerRef.current.focus();
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "inline-block" }}>
      {/* Textbox utama yang selalu berformat DD/MM/YYYY */}
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={textVal}
        onChange={handleTextInputChange}
        onBlur={handleBlur}
        className={className}
        style={{
          width: "100%",
          padding: "8px 36px 8px 10px",
          borderRadius: "10px",
          border: "1px solid rgba(31, 75, 93, 0.25)",
          fontSize: "0.8rem",
          color: "#1F1E19",
          backgroundColor: disabled ? "rgba(0, 0, 0, 0.03)" : "#FFFFFF",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s ease",
          ...style,
        }}
      />

      {/* Tombol Icon Kalender */}
      <button
        type="button"
        tabIndex={0}
        disabled={disabled}
        onClick={handleOpenPicker}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Klik untuk membuka kalender"
        aria-label="Buka kalender tanggal"
        style={{
          position: "absolute",
          right: "6px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          padding: 0,
          margin: 0,
          color: disabled ? "#9CA3AF" : isHovered ? "#0E7490" : "#1F4B5D",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "color 0.15s ease",
          zIndex: 3,
        }}
      >
        <Calendar size={17} />
      </button>

      {/* Input date native tersembunyi */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={nativeValue}
        onChange={handleNativePickerChange}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          border: "none",
          padding: 0,
          margin: 0,
          zIndex: 0,
        }}
      />
    </div>
  );
}

export default DatePicker;
