import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#D9E2FC',
          200: '#B3C5F9',
          300: '#8DA8F6',
          400: '#6B8BF3',
          500: '#4F6BF6', // Primary Brand
          600: '#3A4FD4',
          700: '#2A3BAF',
          800: '#1E2A78',
          900: '#141C54',
          950: '#0C1133',
        },
        accent: {
          400: '#36D399',
          500: '#22C55E', // Success
          600: '#16A34A',
        },
        neutral: {
          50: '#F8F9FC',
          100: '#E5E5ED',
          200: '#C8C8D8',
          700: '#2A2A3C',
          800: '#1C1C27', // Card BG
          900: '#111118', // Section BG
          950: '#0A0A0F', // Page BG
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
