import tailwindForms from '@tailwindcss/forms'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#EC4899',        // Pink utama (CTA / Brand)
        'primary-soft': '#F472B6', // Hover / badge
        secondary: '#16A34A',      // Alam / aman
        accent: '#F59E0B',         // Highlight
        'page-bg': '#FFF5F7',      // Background utama
        'card-bg': '#FFFFFF',     // Card
        'text-main': '#374151',    // Text utama
        'text-muted': '#6B7280',   // Text sekunder
      }
    },
  },
  plugins: [
    tailwindForms,
  ],
}
