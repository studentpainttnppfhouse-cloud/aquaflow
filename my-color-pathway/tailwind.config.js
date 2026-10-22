/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1C2541',
        cream: '#F8F5EF',
        orange: '#E4572E',
        amber: '#F2A541',
        sky: { DEFAULT: '#3A7CA5' },
        leaf: '#7FB685',
        ink: '#4A5068',
      },
      fontFamily: { sans: ['"IBM Plex Sans Thai"', 'Sarabun', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
