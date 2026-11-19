import type { Config } from "tailwindcss";

const tokenColor = (token: string) => `rgb(var(--${token}) / <alpha-value>)`;

const neutralPalette = {
  50: 'rgb(var(--dtb-neutral-50) / <alpha-value>)',
  100: 'rgb(var(--dtb-neutral-100) / <alpha-value>)',
  200: 'rgb(var(--dtb-neutral-200) / <alpha-value>)',
  300: 'rgb(var(--dtb-neutral-300) / <alpha-value>)',
  400: 'rgb(var(--dtb-neutral-400) / <alpha-value>)',
  500: 'rgb(var(--dtb-neutral-500) / <alpha-value>)',
  600: 'rgb(var(--dtb-neutral-600) / <alpha-value>)',
  700: 'rgb(var(--dtb-neutral-700) / <alpha-value>)',
  800: 'rgb(var(--dtb-neutral-800) / <alpha-value>)',
  900: 'rgb(var(--dtb-neutral-900) / <alpha-value>)',
  950: 'rgb(var(--dtb-neutral-950) / <alpha-value>)',
};

const brandPalette = {
  50: '#F1F5F1',
  100: '#DFEBE5',
  200: '#BFD4CA',
  300: '#94B2A6',
  400: '#688B7D',
  500: '#3B6658',
  600: '#173F65',
  700: '#153651',
  800: '#25312D',
  900: '#171B18',
  950: '#0E100F',
};

const seaPalette = {
  50: '#F0F7F6',
  100: '#DBEFEB',
  200: '#BDE1D8',
  300: '#3A7973',
  400: '#2D7374',
  500: '#276B69',
  600: '#173F65',
  700: '#153651',
  800: '#23413B',
  900: '#18201D',
  950: '#101311',
};

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
          50: 'rgb(var(--dtb-sand-50) / <alpha-value>)',
          100: 'rgb(var(--dtb-sand-100) / <alpha-value>)',
          200: 'rgb(var(--dtb-sand-200) / <alpha-value>)',
          300: 'rgb(var(--dtb-sand-300) / <alpha-value>)',
          400: '#C1AA8E',
          500: '#AD9172',
          600: '#94785B',
          700: '#775F48',
          800: '#624F3E',
          900: '#524336',
        },
        ocean: {
          50: '#F0F7F6',
          100: '#DBEFEB',
          200: '#BDE1D8',
          300: '#3A7973',
          400: '#2D7374',
          500: '#276B69',
          600: '#1F5B59',
          700: '#194B4A',
          800: '#1B5555',
          900: '#143F42',
          950: '#0B292D',
        },
        dtb: {
          navy: '#173F65',
          midnight: '#153651',
          ocean: '#145A66',
          classic: '#276B69',
          sky: '#2D7374',
        },
        brand: brandPalette,
        slate: neutralPalette,
        gray: neutralPalette,
        neutral: neutralPalette,
        zinc: neutralPalette,
        blue: brandPalette,
        indigo: brandPalette,
        sky: seaPalette,
        cyan: seaPalette,
        ink: 'var(--color-text)',
        surface: 'var(--color-surface)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
