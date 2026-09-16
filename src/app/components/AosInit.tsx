"use client";
import { useEffect } from 'react';

export default function AosInit() {
  useEffect(() => {
    let cancelled = false;

    const initAos = async () => {
      try {
        const AOS = (await import("aos")).default;
        await import("aos/dist/aos.css");
        if (!cancelled) {
          AOS.init({
            duration: 800,
            once: true,
            easing: "ease-out-cubic",
          });
        }
      } catch (err) {
        console.error("Gagal inisialisasi AOS:", err);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleCallback = window.requestIdleCallback as (
        cb: () => void,
        opts?: { timeout: number }
      ) => number;
      const idleId = idleCallback(initAos, { timeout: 1000 });
      return () => {
        cancelled = true;
        if ("cancelIdleCallback" in window) {
          (window.cancelIdleCallback as (id: number) => void)(idleId);
        }
      };
    } else {
      const timer = setTimeout(initAos, 500);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, []);

  return null;
}
