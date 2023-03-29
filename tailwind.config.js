module.exports = {
  darkMode: 'class',
  purge: {
    content: ["./layouts/**/*.html", "./content/**/*.md", "./content/**/*.html"],
  },
  theme: {
    extend: {
      screens: {
        dark: {
          raw: '(prefers-color-scheme: dark)'
        },
        'phone': '576px',
        'tablet': '640px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        gradientX: 'gradientX 15s ease-in infinite',
        gradientY: 'gradientY 15s ease-in infinite',
        gradientXY: 'gradientXY 15s ease-in infinite',
      },
      keyframes: {
        blink: {
          'from,to': { 'visibility': 'hidden' },
          '50%': { 'visibility': 'visible' }
        },
        gradientY: {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        gradientX: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        gradientXY: {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      }
    },
  },
  variants: {},
  plugins: []
};
