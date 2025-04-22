module.exports = {
  plugins: [require.resolve("prettier-plugin-astro")],
  overrides: [
    {
      files: "**/*.astro",
      options: { parser: "astro" },
    },
  ],
  trailingComma: "es5",
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  printWidth: 100,
  useTabs: false,
};
