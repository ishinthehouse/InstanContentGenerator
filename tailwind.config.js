/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        // UI chrome typography for the redesigned workspace
        ui: ['"Outfit"', '"DM Sans"', 'sans-serif'],
        display: ['"Sora"', '"Outfit"', 'sans-serif'],
      },
      colors: {
        insta: '#E1306C',
        dark: '#0f0f0f',
        // Deep midnight workspace surface scale
        midnight: {
          DEFAULT: '#0A0A0C',
          900: '#0A0A0C',
          800: '#121218',
          700: '#1a1a22',
          600: '#24242e',
        },
        // Brand accents — Royal Indigo → Vivid Pink
        royal: '#6d5efc',
        vivid: '#E1306C',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #6d5efc 0%, #b14ae0 45%, #E1306C 100%)',
        'glow-radial': 'radial-gradient(80% 60% at 50% 0%, rgba(109,94,252,0.18) 0%, rgba(10,10,12,0) 70%)',
      },
      boxShadow: {
        glow: '0 10px 40px -12px rgba(225,48,108,0.45)',
        'glow-royal': '0 10px 40px -12px rgba(109,94,252,0.5)',
        panel: '0 8px 30px -12px rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
