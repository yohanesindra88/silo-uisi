"use client";

import React from "react";
import { FileText, Image as ImageIcon, Download, ExternalLink, FileArchive, FileSpreadsheet, File } from "lucide-react";
import styles from "./file-with-loading.module.css";

export interface FileWithLoadingProps {
  url?: string;
  name?: string;
  size?: string;
  type?: string;
  isLoading?: boolean;
  onDownload?: () => void;
  openInNewTab?: boolean;
  className?: string;
}

export const FileWithLoading: React.FC<FileWithLoadingProps> = ({
  url,
  name = "Dokumen",
  size,
  type,
  isLoading = false,
  onDownload,
  openInNewTab = true,
  className = "",
}) => {
  // Skeleton state
  if (isLoading || !url) {
    return (
      <div className={`${styles.container} ${styles.skeletonContainer} ${className}`}>
        <div className={styles.leftContent}>
          <div className={`${styles.skeletonBox} ${styles.skeletonIcon}`} />
          <div className={styles.fileDetails}>
            <div className={`${styles.skeletonBox} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonBox} ${styles.skeletonMeta}`} />
          </div>
        </div>
        <div className={`${styles.skeletonBox} ${styles.skeletonBtn}`} />
      </div>
    );
  }

  // Detect file type & appropriate icon
  const extension = type || (name.includes(".") ? name.split(".").pop()?.toUpperCase() : "FILE");
  const isPdf = extension?.toUpperCase() === "PDF" || url.endsWith(".pdf");
  const isImg = ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(extension?.toUpperCase() || "");
  const isExcel = ["XLS", "XLSX", "CSV"].includes(extension?.toUpperCase() || "");
  const isZip = ["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(extension?.toUpperCase() || "");

  const getIcon = () => {
    if (isPdf) return <FileText size={22} />;
    if (isImg) return <ImageIcon size={22} />;
    if (isExcel) return <FileSpreadsheet size={22} />;
    if (isZip) return <FileArchive size={22} />;
    return <File size={22} />;
  };

  const getIconClass = () => {
    if (isPdf) return styles.iconPdf;
    if (isImg) return styles.iconImage;
    if (isExcel) return styles.iconDoc;
    return styles.iconDefault;
  };

  return (
    <a
      href={url}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className={`${styles.container} ${className}`}
      onClick={(e) => {
        if (onDownload) {
          e.preventDefault();
          onDownload();
        }
      }}
    >
      <div className={styles.leftContent}>
        <div className={`${styles.iconWrapper} ${getIconClass()}`}>
          {getIcon()}
        </div>
        <div className={styles.fileDetails}>
          <p className={styles.fileName} title={name}>
            {name}
          </p>
          <div className={styles.metaRow}>
            <span className={styles.typeBadge}>{extension}</span>
            {size && <span>• {size}</span>}
          </div>
        </div>
      </div>

      <div className={styles.actionButton}>
        {onDownload ? (
          <>
            <Download size={15} />
            <span>Unduh</span>
          </>
        ) : (
          <>
            <ExternalLink size={15} />
            <span>Buka</span>
          </>
        )}
      </div>
    </a>
  );
};

export default FileWithLoading;
