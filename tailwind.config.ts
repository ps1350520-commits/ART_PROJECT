import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        /**
         * Phone-sized viewports, in either orientation: narrow in portrait,
         * or short in landscape. Every mobile-only rule hangs off this one
         * variant, so nothing in it can reach a desktop window.
         */
        phone: {
          raw: "(max-width: 767px), (max-height: 500px) and (orientation: landscape)",
        },
      },
      colors: {
        steel: {
          950: "#0a0c0e",
          900: "#101418",
          800: "#181d23",
          700: "#242b33",
          600: "#39434e",
          500: "#5b6874",
          400: "#8996a3",
          300: "#b9c4ce",
          200: "#dde3e9",
        },
        ember: "#d97036",
        rust: "#8a4a2b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
    },
  },
  plugins: [],
};

export default config;
