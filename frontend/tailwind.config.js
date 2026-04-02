/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
      colors: {
        ink: "#0B0F19",
        mist: "#F5F7FB",
        sky: "#5B8CFF",
        teal: "#1D9E75",
        coral: "#D85A30",
        sand: "#B4B2A9",
      },
      boxShadow: {
        card: "0 18px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
