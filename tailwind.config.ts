import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        gold: "var(--gold)",
        line: "var(--border)",
      },
      fontFamily: {
        arabic: ['"Amiri Quran"', "serif"],
        urdu: ['"Noto Nastaliq Urdu"', "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
