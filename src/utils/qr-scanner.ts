import jsQR from "jsqr";

/**
 * Memindai QR code dari ImageData menggunakan jsQR dengan multi-attempt
 */
export function decodeImageData(imageData: ImageData): string | null {
  try {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return result ? result.data : null;
  } catch (err) {
    console.warn("jsQR decode error:", err);
    return null;
  }
}

/**
 * Memindai frame video live langsung dari HTMLVideoElement
 */
export function scanVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string | null {
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 || height === 0) return null;

  // Batasi dimensi canvas komputasi maks 1000px agar scanning cepat tanpa lag CPU
  const maxDim = 1000;
  let targetWidth = width;
  let targetHeight = height;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      targetHeight = Math.round((height * maxDim) / width);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((width * maxDim) / height);
      targetHeight = maxDim;
    }
  }

  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  if (canvas.height !== targetHeight) canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  return decodeImageData(imageData);
}

/**
 * Memproses berkas foto dari kamera HP menggunakan 4-Pass multi-algorithm jsQR:
 * Pass 1: Full-frame downscaled (Max 1200px)
 * Pass 2: Center-crop 65% (Fokus area layar tengah monitor / membuang keyboard & bezel)
 * Pass 3: Contrast enhancement pada Center-Crop (Mengatasi silau / pantulan lampu pada layar monitor)
 * Pass 4: Tight-crop 45% (Jika QR di layar laptop terpotret agak jauh)
 */
export async function scanImageFileWithJsQR(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        if (!origWidth || !origHeight) {
          reject(new Error("Dimensi foto tidak valid."));
          return;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi canvas context."));
          return;
        }

        // --- PASS 1: Full-Frame Downscaled (Max 1200px) ---
        const maxDim = 1200;
        let p1Width = origWidth;
        let p1Height = origHeight;
        if (origWidth > maxDim || origHeight > maxDim) {
          if (origWidth > origHeight) {
            p1Height = Math.round((origHeight * maxDim) / origWidth);
            p1Width = maxDim;
          } else {
            p1Width = Math.round((origWidth * maxDim) / origHeight);
            p1Height = maxDim;
          }
        }

        canvas.width = p1Width;
        canvas.height = p1Height;
        ctx.drawImage(img, 0, 0, p1Width, p1Height);
        let imageData = ctx.getImageData(0, 0, p1Width, p1Height);
        let code = decodeImageData(imageData);
        if (code) {
          resolve(code);
          return;
        }

        // --- PASS 2: Center-Crop 65% (Fokus area layar tengah monitor) ---
        const cropRatio = 0.65;
        const cropW = Math.round(origWidth * cropRatio);
        const cropH = Math.round(origHeight * cropRatio);
        const cropX = Math.round((origWidth - cropW) / 2);
        const cropY = Math.round((origHeight - cropH) / 2);

        let p2Width = cropW;
        let p2Height = cropH;
        if (cropW > maxDim || cropH > maxDim) {
          if (cropW > cropH) {
            p2Height = Math.round((cropH * maxDim) / cropW);
            p2Width = maxDim;
          } else {
            p2Width = Math.round((cropW * maxDim) / cropH);
            p2Height = maxDim;
          }
        }

        canvas.width = p2Width;
        canvas.height = p2Height;
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, p2Width, p2Height);
        imageData = ctx.getImageData(0, 0, p2Width, p2Height);
        code = decodeImageData(imageData);
        if (code) {
          resolve(code);
          return;
        }

        // --- PASS 3: Contrast Enhancement pada Center-Crop (Mengatasi Silau Pantulan Layar) ---
        const d = imageData.data;
        let sumLuminance = 0;
        const count = d.length / 4;
        for (let i = 0; i < d.length; i += 4) {
          sumLuminance += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        }
        const avgLum = sumLuminance / count;
        const factor = 1.6;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const newLum = Math.min(255, Math.max(0, avgLum + factor * (lum - avgLum)));
          d[i] = newLum;
          d[i + 1] = newLum;
          d[i + 2] = newLum;
        }

        code = decodeImageData(imageData);
        if (code) {
          resolve(code);
          return;
        }

        // --- PASS 4: Tight Crop 45% (Jika QR di layar laptop terpotret agak jauh) ---
        const tightRatio = 0.45;
        const tW = Math.round(origWidth * tightRatio);
        const tH = Math.round(origHeight * tightRatio);
        const tX = Math.round((origWidth - tW) / 2);
        const tY = Math.round((origHeight - tH) / 2);

        canvas.width = tW;
        canvas.height = tH;
        ctx.drawImage(img, tX, tY, tW, tH, 0, 0, tW, tH);
        imageData = ctx.getImageData(0, 0, tW, tH);
        code = decodeImageData(imageData);
        if (code) {
          resolve(code);
          return;
        }

        reject(new Error("QR Code tidak terdeteksi dari foto. Pastikan posisi tegak, jelas, dan pencahayaan cukup."));
      } catch (err: any) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca berkas gambar."));
    };

    img.src = objectUrl;
  });
}

/**
 * Live Camera Scanner Controller bertenaga jsQR
 */
export class LiveQrScanner {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isScanning = false;
  private onScanCallback: ((data: string) => void) | null = null;
  private lastScannedText = "";
  private lastScannedTime = 0;

  constructor(videoElement: HTMLVideoElement, onScan: (data: string) => void) {
    this.video = videoElement;
    this.canvas = document.createElement("canvas");
    this.onScanCallback = onScan;
  }

  async start(): Promise<void> {
    if (this.isScanning) return;

    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error("Fitur kamera live stream dibatasi oleh browser pada jaringan HTTP (bukan HTTPS). Gunakan tombol 'Ambil Foto QR'.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    this.stream = stream;
    if (this.video) {
      this.video.srcObject = stream;
      this.video.setAttribute("playsinline", "true");
      await this.video.play();
    }

    this.isScanning = true;
    this.tick();
  }

  private tick = () => {
    if (!this.isScanning || !this.video || !this.canvas) return;

    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const decoded = scanVideoFrame(this.video, this.canvas);
      if (decoded) {
        const now = Date.now();
        // Debounce scan beruntun 3 detik untuk token yang sama
        if (decoded !== this.lastScannedText || now - this.lastScannedTime > 3000) {
          this.lastScannedText = decoded;
          this.lastScannedTime = now;
          if (this.onScanCallback) {
            this.onScanCallback(decoded);
          }
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  stop(): void {
    this.isScanning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  destroy(): void {
    this.stop();
  }

  get scanning(): boolean {
    return this.isScanning;
  }
}
