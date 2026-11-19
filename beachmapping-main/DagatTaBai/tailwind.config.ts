import type { Config } from "tailwindcss";

const tokenColor = (token: string) => `rgb(var(--${token}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-navy": {
          50: tokenColor("brand-navy-50"),
          100: tokenColor("brand-navy-100"),
          200: tokenColor("brand-navy-200"),
          300: tokenColor("brand-navy-300"),
          400: tokenColor("brand-navy-400"),
          500: tokenColor("brand-navy-500"),
          600: tokenColor("brand-navy-600"),
          700: tokenColor("brand-navy-700"),
          800: tokenColor("brand-navy-800"),
          900: tokenColor("brand-navy-900"),
        },
        "brand-sun": {
          50: tokenColor("brand-sun-50"),
          100: tokenColor("brand-sun-100"),
          200: tokenColor("brand-sun-200"),
          300: tokenColor("brand-sun-300"),
          400: tokenColor("brand-sun-400"),
          500: tokenColor("brand-sun-500"),
          600: tokenColor("brand-sun-600"),
          700: tokenColor("brand-sun-700"),
        },
        "brand-sand": {
          50: tokenColor("brand-sand-50"),
          100: tokenColor("brand-sand-100"),
          200: tokenColor("brand-sand-200"),
          300: tokenColor("brand-sand-300"),
        },
        "brand-teal": {
          50: tokenColor("brand-teal-50"),
          100: tokenColor("brand-teal-100"),
          200: tokenColor("brand-teal-200"),
          300: tokenColor("brand-teal-300"),
          400: tokenColor("brand-teal-400"),
          500: tokenColor("brand-teal-500"),
          600: tokenColor("brand-teal-600"),
          700: tokenColor("brand-teal-700"),
        },
        sand: {
          50: tokenColor("brand-sand-50"),
          100: tokenColor("brand-sand-100"),
          200: tokenColor("brand-sand-200"),
          300: tokenColor("brand-sand-300"),
        },
        ocean: {
          50: tokenColor("brand-teal-50"),
          100: tokenColor("brand-teal-100"),
          200: tokenColor("brand-teal-200"),
          300: tokenColor("brand-teal-300"),
          400: tokenColor("brand-teal-400"),
          500: tokenColor("brand-teal-500"),
          600: tokenColor("brand-teal-600"),
          700: tokenColor("brand-teal-700"),
          800: tokenColor("brand-teal-700"),
          900: tokenColor("brand-teal-700"),
          950: tokenColor("brand-navy-900"),
        },
        dtb: {
          navy: tokenColor("brand-navy-500"),
          midnight: tokenColor("brand-navy-600"),
          ocean: tokenColor("brand-navy-500"),
          classic: tokenColor("brand-navy-500"),
          sky: tokenColor("brand-teal-600"),
        },
        brand: {
          50: tokenColor("brand-navy-50"),
          100: tokenColor("brand-navy-100"),
          200: tokenColor("brand-navy-200"),
          300: tokenColor("brand-navy-300"),
          400: tokenColor("brand-navy-400"),
          500: tokenColor("brand-navy-500"),
          600: tokenColor("brand-navy-600"),
          700: tokenColor("brand-navy-700"),
          800: tokenColor("brand-navy-800"),
          900: tokenColor("brand-navy-900"),
          950: tokenColor("brand-navy-900"),
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
