import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#131315",
        surface: "#131315",
        "surface-container-lowest": "#0e0e10",
        "surface-container-low": "#1c1b1d",
        "surface-container": "#201f22",
        "surface-container-high": "#2a2a2c",
        "surface-container-highest": "#353437",
        "surface-bright": "#39393b",
        "surface-variant": "#353437",
        "on-surface": "#e5e1e4",
        "on-surface-variant": "#c2c6d6",
        primary: "#adc6ff",
        "primary-container": "#4d8eff",
        "on-primary": "#002e6a",
        secondary: "#4edea3",
        "secondary-container": "#00a572",
        "on-secondary": "#003824",
        outline: "#8c909f",
        "outline-variant": "#424754",
        error: "#ffb4ab",
      },
    },
  },
  plugins: [],
} satisfies Config;
