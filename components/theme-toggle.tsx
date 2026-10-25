"use client";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark" | "sepia";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      setTheme((localStorage.getItem("noor:theme") as Theme) || "system");
    } catch {}
  }, []);

  function change(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem("noor:theme", next);
    } catch {}
    const resolved = next === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next;
    document.documentElement.dataset.theme = resolved;
  }

  return (
    <label className="flex items-center gap-1">
      <span className="sr-only">Theme</span>
      <select
        value={theme}
        onChange={(e) => change(e.target.value as Theme)}
        className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="sepia">Sepia</option>
      </select>
    </label>
  );
}
