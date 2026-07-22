/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#0A0E14',
          bg2: '#10151F',
          panel: 'rgba(20,27,38,0.85)',
          panelSolid: '#141B26',
          edge: 'rgba(45,224,200,0.16)',
          edgeStrong: 'rgba(45,224,200,0.4)',
          track: '#1B2434',
          text: '#E8EDF2',
          dim: '#7C8B9C',
          cyan: '#2DE0C8',
          coral: '#FF6B4A',
          amber: '#FBBF24',
          green: '#34D399',
        },
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"IBM Plex Sans"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 16px rgba(45,224,200,0.35)',
        'glow-coral': '0 0 16px rgba(255,107,74,0.35)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
