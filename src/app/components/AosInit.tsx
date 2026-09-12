"use client";
import { useEffect } from 'react';

export default function AosInit() {
  useEffect(() => {
    // Delay AOS initialization until React client hydration is 100% complete
    const timer = setTimeout(async () => {
      try {
        const AOS = (await import('aos')).default;
        await import('aos/dist/aos.css');
        AOS.init({
          duration: 800,
          once: true,
          easing: 'ease-out-cubic',
        });
      } catch (err) {
        console.error("Gagal inisialisasi AOS:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, []);
  
  return null;
}
