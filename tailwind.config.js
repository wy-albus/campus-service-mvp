/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'PingFang SC',
          'Microsoft YaHei',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        ink: '#EAF2EF',
        muted: 'rgba(248,250,247,0.62)',
        bodyText: 'rgba(248,250,247,0.78)',
        cardTitle: 'rgba(248,250,247,0.95)',
        line: 'rgba(255,255,255,0.14)',
        campus: {
          50: '#EEF8F4',
          100: '#D9EEE6',
          300: '#8BC9B0',
          500: '#3D856E',
          600: '#2F6B5F',
          800: '#183B36',
          900: '#0C1F1D',
        },
        paper: '#F8F4EA',
        amberSoft: '#E7B56B',
      },
      boxShadow: {
        soft: '0 18px 70px rgba(0,0,0,0.24)',
        card: '0 12px 40px rgba(0,0,0,0.16)',
        hairline: 'inset 0 1px 0 rgba(255,255,255,0.18)',
      },
      backgroundImage: {
        'campus-photo':
          'linear-gradient(120deg, rgba(5,13,18,0.78), rgba(13,32,31,0.58)), url("/backgrounds/campus-bg.jpg")',
      },
    },
  },
  plugins: [],
};
