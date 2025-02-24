import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B6B",
        secondary: "#4ECDC4",
        accent: "#FFE66D",
        neutral: "#2C3E50",
        "base-100": "#F7F9FC",
        "base-200": "#E9ECEF",
        "base-300": "#DEE2E6",
        "temp-hot": "#FF6B6B",
        "temp-warm": "#FFB347",
        "temp-mild": "#4ECDC4",
        "temp-cold": "#45B7D1",
      },
      animation: {
        "bounce-slow": "bounce 3s linear infinite",
        "scale-in": "scaleIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "progress-fill": "progressFill 0.8s ease-out",
      },
      keyframes: {
        scaleIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        progressFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFE66D",
          neutral: "#2C3E50",
          "base-100": "#F7F9FC",
          "base-200": "#E9ECEF",
          "base-300": "#DEE2E6",
        },
      },
    ],
  },
}

export default config;
