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
          // 0.50 = 5.3:1 on bg — the darkest white-alpha that clears WCAG AA
          // (4.5:1) for the 11pt labels this token styles; 0.38 measured 3.4:1
          faint: "rgba(255,255,255,0.50)",
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
