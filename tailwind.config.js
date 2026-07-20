/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#060d17',
          panel: '#0b1626',
          edge: '#16283f',
          text: '#c8dcf0',
          dim: '#5f7a96',
          cyan: '#22d3ee',
          amber: '#fbbf24',
          red: '#f87171',
          green: '#34d399',
        },
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
