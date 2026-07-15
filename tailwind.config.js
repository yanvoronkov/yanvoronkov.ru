/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#09090b',
          card: '#18181b',
          border: '#27272a',
          text: '#f4f4f5'
        },
        light: {
          bg: '#fafafa',
          card: '#ffffff',
          border: '#e4e4e7',
          text: '#09090b'
        },
        brand: {
          indigo: '#6366f1',
          violet: '#8b5cf6',
          emerald: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
