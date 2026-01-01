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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Neumorphism base colors
        "neu-base": "#F0F2F5",
        "neu-light": "#FFFFFF",
        "neu-dark": "#D1D9E6",
        // Pastel colors for icons
        "pastel-pink": "#FFB3D9",
        "pastel-mint": "#A8E6CF",
        "pastel-purple": "#C7B3F5",
        "pastel-teal": "#81E6D9",
        "pastel-blue": "#B3D9FF",
      },
      boxShadow: {
        // Neumorphism shadows - the soul of the style
        "soft-out": "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff",
        "soft-in": "inset 8px 8px 16px #d1d9e6, inset -8px -8px 16px #ffffff",
        "soft-button": "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff",
        "soft-button-pressed": "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
        "soft-card": "10px 10px 20px #d1d9e6, -10px -10px 20px #ffffff",
        "soft-icon": "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
      },
      borderRadius: {
        "neu": "20px",
        "neu-lg": "30px",
        "neu-xl": "40px",
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

