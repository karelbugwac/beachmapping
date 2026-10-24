import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#faf8f5',
          100: '#f4efe8',
          200: '#e8ded0',
          300: '#d7c7b0',
          400: '#c1aa8e',
          500: '#ad9172',
          600: '#94785b',
          700: '#775f48',
          800: '#624f3e',
          900: '#524336',
        },
        ocean: {
          50: '#f0f7fb',
          100: '#dcedf5',
          200: '#bedde9',
          300: '#8fc4d9',
          400: '#5ba6c4',
          500: '#3a8baa',
          600: '#2c6f8c',
          700: '#265972',
          800: '#234a5d',
          900: '#213f4f',
          950: '#0b1b26',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
