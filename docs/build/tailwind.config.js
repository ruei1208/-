// Rebuild docs/tailwind.css after changing Tailwind classes in index.html or main.js:
//   npx tailwindcss@3 -c docs/build/tailwind.config.js -i docs/build/input.css -o docs/tailwind.css --minify
module.exports = {
  content: ['./docs/index.html', './docs/main.js'],
  theme: { extend: {
    colors: { ink: '#E6E9EE', sub: '#9AA3AF', base: '#0F1216', alt: '#171B21', card: '#1F242C', edge: '#2C333D', volt: '#3B82F6', voltl: '#60A5FA', silver: '#C9D1DB', amber: '#F59E0B' },
    fontFamily: { sans: ['Inter', '"Noto Sans TC"', 'sans-serif'], mono: ['"JetBrains Mono"', 'monospace'] },
  } },
};
