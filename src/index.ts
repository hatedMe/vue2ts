#!/usr/bin/env node

import commander from "commander";
const { version } = require("../package.json");
import traverse from "./traverse";

const program = new commander.Command();
program.version(version, "-v, --version", "output the current version of the program");
program.option("-i, --input <input>", "input file path or directory", outFile);
program.parse();

function outFile(input: string) {
    traverse(input);
}
