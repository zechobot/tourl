/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d1117",
        panel: "#111820",
        line: "#1f2a33",
        moss: "#3fb950",
        wheat: "#e6b450",
        bone: "#e6edf3",
        dim: "#7d8b98",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'Space Grotesk'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(#1f2a33 1px, transparent 1px), linear-gradient(90deg, #1f2a33 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
