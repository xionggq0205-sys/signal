/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Linear-inspired palette
        bg: {
          DEFAULT: "#0F172A",
          card: "#1B2336",
          hover: "#1E293B",
        },
        accent: {
          DEFAULT: "#5E6AD2",
          light: "#7C82E0",
          glow: "rgba(94, 106, 210, 0.25)",
        },
        fg: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          dim: "#64748B",
        },
        border: {
          DEFAULT: "#1E293B",
          light: "#334155",
          accent: "#475569",
        },
        red: "#EF4444",
        green: "#22C55E",
        amber: "#F59E0B",
      },
      fontFamily: {
        sans: [
          "Geist",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "2px",
        lg: "4px",
        xl: "8px",
      },
    },
  },
  plugins: [],
};
