import type { Config } from 'tailwindcss';

/**
 * Tokens del prototipo v2.2. Los colores viven en CSS variables
 * (index.css) para que el tema oscuro los pueda intercambiar en runtime,
 * y acá se exponen como utilidades de Tailwind.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--ink)',
        surface: 'var(--surface)',
        edge: 'var(--edge)',
        lime: 'var(--lime)',
        'lime-soft': 'var(--lime-soft)',
        'lime-deep': 'var(--lime-deep)',
        olive: 'var(--olive)',
        lilac: 'var(--lilac)',
        butter: 'var(--butter)',
        peach: 'var(--peach)',
        blue: 'var(--blue)',
        mint: 'var(--mint)',
        gray1: 'var(--gray)',
        gray2: 'var(--gray2)',
        'bar-bg': 'var(--bar-bg)',
      },
      borderRadius: {
        card: '26px',
        field: '18px',
      },
      fontFamily: {
        sans: ["'Hanken Grotesk'", 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
