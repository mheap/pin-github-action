import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier";

export default defineConfig([{
    plugins: {
        prettier,
    },

    languageOptions: {
        ecmaVersion: 2023,
        sourceType: "module",

        parserOptions: {
            impliedStrict: true,
        },
    },

    rules: {
        "prettier/prettier": "error",
        curly: ["error", "all"],
    },
}]);