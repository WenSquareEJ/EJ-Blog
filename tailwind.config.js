/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mc: {
          grass: "#5EB14A",
          dirt: "#7C5A3E",
          stone: "#6B7280",
          charcoal: "#1F2937",
          sky: "#87CEEB",
          water: "#3B82F6",
          lava: "#EF4444",
          sand: "#E4D2A0",
          leaf: "#3E8E41",
        },
      },
      fontFamily: {
        mc: ['"Press Start 2P"', "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        mc: "0 0 0 2px #000 inset, 0 4px 0 0 rgba(0,0,0,.20)",
        "mc-soft": "0 0 0 2px #000 inset, 0 2px 0 0 rgba(0,0,0,.12)",
      },
      borderRadius: {
        block: "0.5rem",
      },
      maxWidth: {
        site: "72rem",
      },
    },
  },
  safelist: [
    // in case classes appear via CMS/content
    "bg-mc-grass", "text-mc-stone", "text-mc-charcoal",
    "btn-mc", "btn-mc-secondary", "btn-mc-danger",
    "card-block", "rounded-block", "mc-nav", "banner-placeholder",
  ],
  plugins: [],
};
