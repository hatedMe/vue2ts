import { defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default defineConfig({
    input: "src/index.ts",
    output: {
        file: "dist/index.js",
        format: "cjs",
    },
    plugins: [json(), commonjs(), resolve(), typescript()],
});
