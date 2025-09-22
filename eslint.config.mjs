import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules, // enable eslint:recommended
      "no-unused-vars": "error",       // explicitly enforce unused vars
    },
  },
];
