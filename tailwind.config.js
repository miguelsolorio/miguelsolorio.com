module.exports = {
  purge: {
    content: ["./layouts/**/*.html", "./content/**/*.md", "./content/**/*.html"],
  },
  theme: {
    extend: {
      screens: {
        dark: { raw: '(prefers-color-scheme: dark)' },
      },
    },
  },
  variants: {},
  plugins: []
};
