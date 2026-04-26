import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', '"Iowan Old Style"', "Georgia", "serif"],
        sans: ['"Inter"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "system-ui", "sans-serif"],
      },
      colors: {
        paper: { bg: "#F8F7F4", card: "#FDFCF9", text: "#1A1A1A", muted: "#6B6B6B", line: "#E6E3DC" },
        night: { bg: "#0F1115", card: "#16181D", text: "#EAEAEA", muted: "#8A8E97", line: "#23262C" },
        ember: { bg: "#F3E9DC", card: "#FBF4E8", text: "#2B2B2B", muted: "#7A6A55", line: "#E1D3BD", accent: "#A07855" },
      },
      borderRadius: { DEFAULT: "8px" },
    },
  },
  plugins: [],
};
export default config;
