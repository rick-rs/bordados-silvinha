/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './index.tsx', './App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        illusion: '#f7b1c7',
        chantilly: '#f9c3d1',
        wewak: '#f0a3b5',
        froly: '#f57a9d',
        frenchRose: '#f2507d',
        ink: '#3b1824',
        mauve: '#7b4b5a',
      },
      boxShadow: {
        softPink: '0 24px 70px rgba(242, 80, 125, 0.20)',
      },
    },
  },
  plugins: [],
};
