import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "build/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...eslintConfigPrettier.rules,
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
    },
  },
];

export default eslintConfig;
