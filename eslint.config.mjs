// eslint.config.mjs

import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest, // Added Jest globals to avoid lint issues
      },
    },
    rules: {
      ...js.configs.recommended.rules, 
      "no-unused-vars": "error",      
    },
  },
];
