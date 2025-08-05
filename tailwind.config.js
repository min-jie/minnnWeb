/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#AEEBFF',
      },
      fontFamily: {
        'gensen': ['GenSenRounded TW', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
