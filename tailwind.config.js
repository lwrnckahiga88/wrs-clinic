export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10241F',
        'ink-soft': '#4B5A55',
        paper: '#FBF7EE',
        'paper-dim': '#F3EEE0',
        wrs: {
          teal: '#0F766E',
          dark: '#0B4F49' // alias so any leftover wrs-dark classnames still resolve
        },
        'teal-deep': '#0B4F49',
        amber: '#E2A63B',
        signal: '#3FA34D',
        rule: '#DCD5C4'
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      borderRadius: {
        wrs: '14px'
      }
    }
  },
  plugins: []
};
