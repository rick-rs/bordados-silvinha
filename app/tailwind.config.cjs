/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './index.tsx', './App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
