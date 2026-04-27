import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          900: "#064e3b"
        },
        ink: "#0f172a",
        mist: "#f8fafc",
        line: "#e2e8f0"
      },
      boxShadow: {
        panel: "0 8px 30px rgba(15, 23, 42, 0.08)"
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
