#!/usr/bin/env node
import { program } from "commander";
import * as fs from "fs";
import { createRequire } from "module";
import * as path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const figlet = require("figlet");

const scriptPath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(scriptPath);

// Display ASCII banner only if not suppressed
if (process.env.ORB_NO_BANNER !== "true") {
  console.log(figlet.textSync("orb"));
}

// Default to interactive 'manage' when no command is provided
if (process.argv.length <= 2) {
  process.argv.push("manage");
}

program.version(
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"))
    .version
);

import {
  create,
  debug,
  dev,
  down,
  jestOrta,
  logs,
  manage,
  monorepo,
  profile,
  restart,
  watch,
} from "./commands/index.js";

program.addCommand(create);
program.addCommand(monorepo);
program.addCommand(profile);
program.addCommand(manage);
program.addCommand(watch);
program.addCommand(debug);
program.addCommand(logs);
program.addCommand(restart);
program.addCommand(down);
program.addCommand(dev);
program.addCommand(jestOrta);

program.parse(process.argv);
