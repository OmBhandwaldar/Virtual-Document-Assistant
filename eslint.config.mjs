import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/**", // Ignore Prisma generated files
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Make any types warnings instead of errors globally
      "@typescript-eslint/no-require-imports": "warn", // Make require imports warnings instead of errors
      "@typescript-eslint/no-unused-vars": "warn", // Make unused vars warnings instead of errors
      "react/no-unescaped-entities": "warn", // Make unescaped entities warnings instead of errors
    },
  },
];

export default eslintConfig;
