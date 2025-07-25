#!/usr/bin/env node
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import figlet from "figlet";
import { program } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import { generate } from "./commands/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");
dotenv.config({ path: envPath });
const pkgPath = path.join(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

console.log(figlet.textSync("world-builder-cli"));

program.version(pkg.version);

program.addCommand(generate);

program.parse(process.argv);
