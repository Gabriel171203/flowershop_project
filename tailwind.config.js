/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./products.html",
    "./about.html",
    "./contact.html",
    "./thank-you.html",
    "./pending-payment.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4a6f7d',
        secondary: '#2c3e50',
        accent: '#e74c3c',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
