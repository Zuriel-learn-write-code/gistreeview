const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
    './public/**/*.html'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function({ addUtilities }) {
      // transition-discrete: a step-style timing function useful for "discrete" feel
      addUtilities({
        '.transition-discrete': {
          'transition-timing-function': 'steps(1,end)'
        }
      });
    })
  ]
};
