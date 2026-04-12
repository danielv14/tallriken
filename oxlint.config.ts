import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "typescript", "unicorn", "oxc", "react", "vitest"],

  categories: {
    correctness: "error",
    suspicious: "warn",
  },

  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-children-prop": "off",
    "no-var": "error",
    "prefer-const": "error",
    eqeqeq: ["error", "always", { null: "ignore" }],
    "typescript/no-explicit-any": "warn",
  },

  settings: {
    react: {
      linkComponents: [{ name: "Link", attributes: ["to"] }],
    },
  },

  ignorePatterns: ["src/routeTree.gen.ts"],

  overrides: [
    {
      files: ["**/__tests__/**", "**/*.test.ts"],
      plugins: ["vitest"],
      rules: {
        "unicorn/no-new-array": "off",
        "vitest/require-mock-type-parameters": "off",
      },
    },
  ],
});
