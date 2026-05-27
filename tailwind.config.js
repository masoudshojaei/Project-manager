/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        github: {
          bg: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          fg: '#e6edf3',
          dim: '#8b949e',
          green: '#238636',
          'green-bright': '#3fb950',
          red: '#f85149',
          yellow: '#d29922',
          blue: '#58a6ff',
          purple: '#a371f7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
