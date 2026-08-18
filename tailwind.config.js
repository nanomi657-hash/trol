/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        liquid: {
          bg: "#0b0f19",
          card: "rgba(18, 24, 38, 0.6)",
          glass: "rgba(255, 255, 255, 0.03)",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#6366f1",
          neon: "#a855f7",
        },
      },
      backdropBlur: {
        liquid: "20px",
      },
      animation: {
        "pulse-glow": "pulseGlow 4s infinite alternate",
      },
      keyframes: {
        pulseGlow: {
          "0%": { opacity: "0.3", transform: "scale(1)" },
          "100%": { opacity: "0.6", transform: "scale(1.1)" },
        },
      },
    },
  },
  plugins: [],
};
