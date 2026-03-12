/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        zuno: {
          bg:      '#f8f7f5',
          surface: '#ffffff',
          card:    '#f2f0ec',
          hover:   '#eceae5',
          text:    '#1a1917',
          muted:   '#8c8880',
          accent:  '#c4b8a8',
          border:  'rgba(0,0,0,0.06)',
        },
      },
    },
  },
  plugins: [],
}
