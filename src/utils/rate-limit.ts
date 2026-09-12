/**
 * Rate limiter in-memory sederhana.
 *
 * Memadai untuk deployment ini karena hanya ada satu replika container app
 * (lihat docker-compose.yml). Restart container mereset jendela — konsekuensi
 * yang diterima secara sadar; ini jaring pengaman terhadap penyalahgunaan,
 * bukan kuota penagihan.
 *
 * Kalau suatu saat aplikasi diskalakan ke banyak replika, state ini harus
 * pindah ke Postgres atau Redis.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Bersihkan entri kedaluwarsa sesekali supaya Map tidak tumbuh tanpa batas. */
function sweep(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Detik sampai jendela direset — untuk header Retry-After. */
  retryAfter: number;
}

/**
 * Catat satu percobaan untuk `key`.
 *
 * @param key      Pengenal stabil, biasanya user id dari JWT (bukan IP — di
 *                 belakang Cloudflare Tunnel seluruh request terlihat berasal
 *                 dari alamat yang sama).
 * @param limit    Jumlah percobaan yang diizinkan per jendela.
 * @param windowMs Panjang jendela dalam milidetik.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfter: 0,
  };
}

/** Hanya untuk pengujian. */
export function __resetRateLimit(): void {
  buckets.clear();
}
