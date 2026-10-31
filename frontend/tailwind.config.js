/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0e17',
          card: '#111827',
          border: '#1f293d',
          accent: '#00f0ff',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
