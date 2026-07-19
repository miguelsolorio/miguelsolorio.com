module.exports = {
  darkMode: 'class',
  content: [
    './layouts/**/*.html',
    './content/**/*.{html,md}',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        link: '#241bc7',
        primary: '#3429ff',
        'primary-ink': '#2a25ff',
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
};
