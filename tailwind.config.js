module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,svg}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#6638b8",
      },
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
