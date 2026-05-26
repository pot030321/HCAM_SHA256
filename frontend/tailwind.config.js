/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        panel: '#f7f8fa',
        line: '#d8dee4',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(23, 32, 38, 0.08)',
      },
    },
  },
  plugins: [],
};
