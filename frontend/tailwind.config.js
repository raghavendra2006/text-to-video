/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govNavy: '#0b0f19',
        govSlate: '#1a1f2c',
        saffron: '#ff671f',
        tricolorGreen: '#138808',
      }
    },
  },
  plugins: [],
}
