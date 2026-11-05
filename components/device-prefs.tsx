"use client";
import { useEffect } from "react";

/** Applies saved account preferences on a device that has no local choice yet. A local choice always wins. */
export function DevicePrefs({ theme, size }: { theme: string | null; size: number | null }) {
  useEffect(() => {
    try {
      if (theme && !localStorage.getItem("noor:theme")) {
        localStorage.setItem("noor:theme", theme);
        const resolved = theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
        document.documentElement.dataset.theme = resolved;
      }
      if (size && !localStorage.getItem("noor:arabic-size-v2")) {
        localStorage.setItem("noor:arabic-size-v2", String(size));
        document.documentElement.style.setProperty("--arabic-size", `${size}px`);
      }
    } catch {}
  }, [theme, size]);
  return null;
}
