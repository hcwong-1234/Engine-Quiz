/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        alice: "#EFF3F9",   // Alice Blue
        paynes: "#646F78",  // Payne's gray
        charcoal: "#2A3E52",// Charcoal
        gunmetal: "#233140",// Gunmetal
        glaucous: "#6785A9" // Glaucous
      },
    },
  },
  plugins: []
};
