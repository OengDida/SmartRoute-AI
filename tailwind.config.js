/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { ink: '#071411', panel: '#0d1e19', emeraldx: '#20d69a', amberx: '#f7b84b' },
    boxShadow: { glow: '0 0 35px rgba(32,214,154,.18)' }
  }},
  plugins: []
}
