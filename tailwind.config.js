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
      animation: {
        gradientX: 'gradientX 15s ease infinite',
        gradientY: 'gradientY 15s ease infinite',
        gradientXY: 'gradientXY 15s ease infinite',
      },
      keyframes: {
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