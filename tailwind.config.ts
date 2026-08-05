import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2F2F7',
        surface: '#FFFFFF',
        surfaceSunken: '#E5E5EA',
        ink: {
          DEFAULT: '#000000',
          soft: '#3C3C43',
          faint: '#8E8E93',
        },
        line: 'rgba(60, 60, 67, 0.12)',
        track: {
          DEFAULT: '#FF3B30',
          soft: '#FFECEB',
          dark: '#D70015',
        },
        recovery: {
          DEFAULT: '#34C759',
          soft: '#EAF8ED',
          dark: '#248A3D',
        },
        zone: {
          DEFAULT: '#007AFF',
          soft: '#E5F1FF',
          dark: '#0051A8',
        },
        signal: {
          DEFAULT: '#FF9500',
          soft: '#FFF4E5',
          dark: '#C67300',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
        body: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'sans-serif'],
        stat: ['var(--font-stat)', 'SF Pro Rounded', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        pill: '9999px',
        ios: '14px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
        iosTab: '0 -0.5px 0 rgba(60, 60, 67, 0.12)',
        iosHeader: '0 0.5px 0 rgba(60, 60, 67, 0.12)',
        float: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      },
      keyframes: {
        drawLine: {
          '0%': { strokeDashoffset: '600' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        drawLine: 'drawLine 1.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;

