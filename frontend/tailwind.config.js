/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F4C3A',
        'primary-hover': '#0A3A2C',
        accent: '#B7E4C7',
        background: '#F5F7FA',
        surface: '#FFFFFF',
        border: '#E8E8E8',
        text: '#333333',
        'text-muted': '#666666',
      },
    },
  },
  plugins: [],
};
