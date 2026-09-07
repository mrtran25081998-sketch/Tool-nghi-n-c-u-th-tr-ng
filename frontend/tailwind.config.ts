import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "mb-blue": "#1646d8",
        "mb-blue-2": "#2563eb",
        "mb-blue-50": "#eef5ff",
        "mb-blue-100": "#e1ecff",
        ink: "#0f2357",
        muted: "#667085",
        line: "#d9e2f2",
        soft: "#f7f9fc",
        soft2: "#f2f5fa",
        green: {
          DEFAULT: "#18a566",
          bg: "#e9f8f0",
        },
        red: {
          DEFAULT: "#ef3f4b",
          bg: "#fff0f1",
        },
        amber: {
          DEFAULT: "#f59e0b",
          bg: "#fff7df",
        },
      },
      boxShadow: {
        card: "0 6px 22px rgba(16,42,89,.07)",
        dropdown: "0 14px 36px rgba(15,35,87,.18)",
        modal: "0 24px 70px rgba(12,34,80,.25)",
      },
    },
  },
  plugins: [],
};
export default config;
