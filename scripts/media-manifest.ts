/**
 * Daftar aset yang WAJIB ada di public/ tapi dulunya hanya hidup di Cloudinary.
 *
 * Kenapa hardcoded dan bukan hasil regex atas komponen: regex yang meleset
 * menghasilkan gambar rusak secara diam-diam tiga minggu kemudian. Array ini
 * terlihat di code review dan ter-diff dengan rapi.
 *
 * Sumber setiap entri:
 *   - src/app/components/DokumentasiGallery.tsx  (DOC_ITEMS)
 *   - src/app/components/SponsorSection.tsx      (logoSrc tiap tier)
 *   - src/app/components/PanitiaCarousel.tsx     (image tiap panitia)
 *   - src/app/components/SambutanSection.tsx     (nabil_qudsi, sudah tercakup)
 *   - src/app/about/page.tsx                     (portfolio_phones)
 */

/** 12 foto dokumentasi — perhatikan doc_2 memang tidak ada. */
export const DOKUMENTASI_ASSETS = [
  "/dokumentasi/doc_1.webp",
  "/dokumentasi/doc_3.webp",
  "/dokumentasi/doc_4.webp",
  "/dokumentasi/doc_5.webp",
  "/dokumentasi/doc_6.webp",
  "/dokumentasi/doc_7.webp",
  "/dokumentasi/doc_8.webp",
  "/dokumentasi/doc_9.webp",
  "/dokumentasi/doc_10.webp",
  "/dokumentasi/doc_11.webp",
  "/dokumentasi/doc_12.webp",
  "/dokumentasi/doc_13.webp",
];

/** 9 logo sponsor — 7 .svg (disajikan apa adanya) + 2 .webp (punya varian). */
export const SPONSOR_ASSETS = [
  "/sponsors/sig.webp",
  "/sponsors/mandiri.webp",
  "/sponsors/telkomsel.svg",
  "/sponsors/indofood.svg",
  "/sponsors/kahf.svg",
  "/sponsors/sosro.svg",
  "/sponsors/leminerale.svg",
  "/sponsors/grab.svg",
  "/sponsors/gojek.svg",
];

/** 12 potret panitia + 1 ilustrasi halaman about. */
export const ROOT_ASSETS = [
  "/alfian_fatoni.webp",
  "/callysta_goesti.webp",
  "/dealova_fransisca.webp",
  "/faidza_airlangga.webp",
  "/hillyatut_taqiya.webp",
  "/ivandy_rohman.webp",
  "/jefranda_dinata.webp",
  "/khairun_niza.webp",
  "/nabil_qudsi.webp",
  "/putri_fara.webp",
  "/rosyid_ridlo.webp",
  "/zahra_naila.webp",
  "/portfolio_phones.webp",
];

/** Seluruh 34 aset yang harus di-drop manual sebelum Phase 2. */
export const REQUIRED_ASSETS = [
  ...DOKUMENTASI_ASSETS,
  ...SPONSOR_ASSETS,
  ...ROOT_ASSETS,
];
