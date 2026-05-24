import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f0",
          100: "#ffe0cc",
          500: "#ff6b2b",
          600: "#e85a1a",
          700: "#c44a12",
        },
      },
    },
  },
  plugins: [],
};

export default config;
