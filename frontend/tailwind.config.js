/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        atelier: {
          obsidian: '#090b10',
          slate: '#11141d',
          champagne: '#e2b76f',
          sky: '#8ab4f8'
        }
      }
    }
  },
  plugins: []
};
