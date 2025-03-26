import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginTS from "@typescript-eslint/eslint-plugin";
import { configs as tsConfigs } from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"], // 👈 Ensure TypeScript files are included
    ignores: ["node_modules/*", "pb_data/*", "pb_public/*", "tmp/*", "uploads/*", "frontend/dist/*", "frontend/node_modules/*"], // 👈 Keep this to avoid linting build files
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": eslintPluginTS,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...tsConfigs.recommended.rules,
      "prettier/prettier": "error",
    },
  },
];