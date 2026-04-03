export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          700: "#1d4ed8",
          900: "#172554"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(59, 130, 246, 0.18)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top left, rgba(59,130,246,0.28), transparent 30%), radial-gradient(circle at bottom right, rgba(14,165,233,0.2), transparent 28%), linear-gradient(135deg, #f8fbff, #eef6ff 42%, #e4f0ff)"
      }
    }
  },
  plugins: []
};
