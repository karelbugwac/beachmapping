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
        dtb: {
          navy: '#21386F',     // Deep Navy Blue (Primary buttons & key highlights)
          midnight: '#264D89', // Midnight Blue
          ocean: '#2B5F9D',    // Ocean Blue
          classic: '#3A72AC',  // Classic Blue
          sky: '#4987BA',      // Ocean Sky Blue
        },
        brand: {
          50: '#f0f4f9',
          100: '#dbe5f3',
          200: '#b9cfe8',
          300: '#8ab1db',
          400: '#4987BA',  // Ocean Sky Blue
          500: '#3A72AC',  // Classic Blue
          600: '#2B5F9D',  // Ocean Blue
          700: '#264D89',  // Midnight Blue
          800: '#21386F',  // Deep Navy Blue (button color!)
          900: '#17274f',
          950: '#0e1832',
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
