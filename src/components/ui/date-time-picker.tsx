"use client";

import React, { useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { formatDateTimeInput, toDateTimeLocalValue } from "@/utils/date";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

/**
 * Komponen DateTimePicker dengan textbox format "DD/MM/YY HH:mm"
 * dan tombol icon kalender yang menyatu bersih tanpa background di dalam textbox.
 * Mengklik tombol icon kalender langsung membuka popup kalender & pemilih waktu.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "DD/MM/YY HH:mm (Contoh: 17/09/26 07:00)",
  disabled = false,
  required = false,
  id,
  name,
  style,
}: DateTimePickerProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Nilai yang ditampilkan di textbox: selalu berformat "DD/MM/YY HH:mm"
  const displayValue = formatDateTimeInput(value);

  // Nilai untuk elemen picker native (YYYY-MM-DDTHH:mm)
  const nativeValue = toDateTimeLocalValue(value);

  // Saat user memilih tanggal & jam dari popup kalender
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) {
      onChange("");
      return;
    }
    const formatted = formatDateTimeInput(rawVal);
    onChange(formatted);
  };

  // Saat user mengetik langsung di textbox
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Membuka popup kalender browser saat tombol icon kalender diklik
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
      {/* Textbox utama yang menampilkan format DD/MM/YY HH:mm */}
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleTextInputChange}
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

      {/* Tombol Icon Kalender Menyatu Tanpa Background */}
      <button
        type="button"
        tabIndex={0}
        disabled={disabled}
        onClick={handleOpenPicker}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Klik untuk membuka kalender"
        aria-label="Buka kalender tanggal & waktu"
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

      {/* Input datetime-local tersembunyi yang dibuka oleh tombol showPicker() */}
      <input
        ref={pickerRef}
        type="datetime-local"
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
