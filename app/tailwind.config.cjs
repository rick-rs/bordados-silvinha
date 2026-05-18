/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './index.tsx', './App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary
        primary: {
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        // Text / surfaces
        graphite: 'rgb(var(--color-graphite) / <alpha-value>)',
        white: 'rgb(var(--color-white) / <alpha-value>)',
        ice: 'rgb(var(--color-ice) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        // Status
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',

        // Backwards compatibility (mapped to new palette)
        illusion: 'rgb(var(--color-illusion) / <alpha-value>)',
        chantilly: 'rgb(var(--color-chantilly) / <alpha-value>)',
        wewak: 'rgb(var(--color-wewak) / <alpha-value>)',
        froly: 'rgb(var(--color-froly) / <alpha-value>)',
        frenchRose: 'rgb(var(--color-french-rose) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        mauve: 'rgb(var(--color-mauve) / <alpha-value>)',
      },
      boxShadow: {
        softPink: '0 24px 70px rgba(242, 80, 125, 0.20)',
      },
    },
  },
  plugins: [],
};
