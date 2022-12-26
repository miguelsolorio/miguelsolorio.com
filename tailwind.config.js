module.exports = {
  purge: {
    content: ["./layouts/**/*.html", "./content/**/*.md", "./content/**/*.html"],
  },
  theme: {
    extend: {
      screens: {
        dark: {
          raw: '(prefers-color-scheme: dark)'
        },
      },
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        'royal': '#2F5CFC',
        'purple': '#3f3cbb',
        'midnight': '#121063',
        'metal': '#565584',
        'tahiti': '#3ab7bf',
        'silver': '#ecebff',
        'bubble-gum': '#ff77e9',
        'bermuda': '#78dcca',
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
          '50%': { 'visibility': 'visible'}
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