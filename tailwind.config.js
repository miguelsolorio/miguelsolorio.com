module.exports = {
  darkMode: 'class',
  purge: {
    content: ["./layouts/**/*.html", "./content/**/*.md", "./content/**/*.html"],
  },
  theme: {
    extend: {
      colors: {
        'primary': '#2A25FF',
      },
      screens: {
        dark: {
          raw: '(prefers-color-scheme: dark)'
        },
        'phone': '576px',
        'tablet': '640px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      keyframes: {
        typing: {
          "0%": {
            width: "0%",
            visibility: "hidden"
          },
          "100%": {
            width: "100%"
          }
        },
        blink: {
          "50%": {
            borderColor: "transparent"
          },
          "100%": {
            borderColor: "white"
          }
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
      },
      animation: {
        typing: "typing 2s steps(20) infinite alternate, blink .7s",
        gradientX: 'gradientX 15s ease-in infinite',
        gradientY: 'gradientY 15s ease-in infinite',
        gradientXY: 'gradientXY 15s ease-in infinite',
      }
    },
  },
  variants: {},
  plugins: [
  ]
};
