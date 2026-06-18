/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // monochrome WAYMARK palette (ported from the HTML POC)
        bg: "#050505",
        panel: "#0b0b0b",
        "panel-2": "#121212",
        ink: {
          DEFAULT: "#ffffff",
          dim: "rgba(255,255,255,0.60)",
          faint: "rgba(255,255,255,0.38)",
        },
        glass: "rgba(255,255,255,0.08)",
        line: "rgba(255,255,255,0.14)",
      },
      fontFamily: {
        // Clash Display — headlines
        display: ["ClashDisplay-Semibold"],
        "display-md": ["ClashDisplay-Medium"],
        "display-bold": ["ClashDisplay-Bold"],
        // Plus Jakarta Sans — body / UI
        sans: ["PlusJakartaSans_400Regular"],
        "sans-medium": ["PlusJakartaSans_500Medium"],
        "sans-semibold": ["PlusJakartaSans_600SemiBold"],
        "sans-bold": ["PlusJakartaSans_700Bold"],
      },
    },
  },
  plugins: [],
};
