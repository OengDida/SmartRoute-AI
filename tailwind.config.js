/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      ink: 'rgb(var(--text-rgb) / <alpha-value>)',
      panel: 'rgb(var(--surface-rgb) / <alpha-value>)',
      emeraldx: 'rgb(var(--brand-rgb) / <alpha-value>)',
      amberx: 'rgb(var(--warning-rgb) / <alpha-value>)',
    },
    boxShadow: { glow: 'var(--shadow-soft)' }
  }},
  plugins: []
}
