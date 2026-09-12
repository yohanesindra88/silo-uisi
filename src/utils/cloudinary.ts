/**
 * @deprecated Cloudinary sudah tidak dipakai. Impor `getMediaUrl` dari "@/utils/media".
 *
 * Shim ini sengaja dipertahankan agar commit yang memindahkan seluruh situs dari
 * Cloudinary ke penyimpanan server hanya menyentuh satu berkas — sehingga bisa
 * di-`git revert` tanpa berpikir kalau ada yang rusak di produksi.
 *
 * Rencananya dihapus bersamaan dengan rename 9 call site (lihat Phase 7).
 */
export { getMediaUrl as getCloudinaryUrl } from "./media";
