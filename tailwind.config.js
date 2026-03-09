/** @type {import('tailwindcss').Config} */
// Lebanon-centric palette: cedar + white lead, red accent; selection = cedar + CedarTreeIcon
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'table': '#00A651',
        'felt': '#FFFFFF',
        'cedar': '#00A651',
        'cedar-dark': '#006233',
        'cedar-light': '#E8F5E9',
        'lebanon-red': '#CE1126',
        'wood': '#006233',
        'wood-frame': '#00A651',
        'wood-light': '#00A651',
        'cream': '#F5F5DC',
        'gold': '#00A651',
        'success': '#00A651',
        'danger': '#c53030',
        'text-primary': '#1B5E20',
        'text-secondary': '#2E7D32',
        'text-on-cream': '#2d2318',
        'text-on-cedar': '#FFFFFF',
      },
      fontFamily: {
        body: ['Lexend', 'system-ui', 'sans-serif'],
        heading: ['Lora', 'Georgia', 'serif'],
      },
      spacing: {
        'card-w-base': 'var(--card-width-base)',
        'card-h-base': 'var(--card-height-base)',
        'card-w-compact': 'var(--card-width-compact)',
        'card-h-compact': 'var(--card-height-compact)',
        'card-w-xs': 'var(--card-width-extra-compact)',
        'card-h-xs': 'var(--card-height-extra-compact)',
        'card-w-micro': 'var(--card-width-micro)',
        'card-h-micro': 'var(--card-height-micro)',
      },
      gap: {
        'zone-base': 'var(--zone-gap-base)',
        'zone-compact': 'var(--zone-gap-compact)',
        'zone-xs': 'var(--zone-gap-extra-compact)',
      },
    },
  },
  plugins: [],
}
