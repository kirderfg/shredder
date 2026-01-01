export default [
  {
    ignores: ["node_modules/**", "playwright-report/**", "test-results/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Relaxed rules for this project
    },
  },
];
