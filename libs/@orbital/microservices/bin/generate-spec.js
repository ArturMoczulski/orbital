#!/usr/bin/env node
/**
 * CLI to generate AsyncAPI JSON spec via static analysis with ts-morph.
 *
 * Usage:
 *   generate-spec.js \
 *     --src-dir path/to/src \
 *     --out path/to/asyncapi.json \
 *     --title "Service Name" \
 *     [--version "1.0.0"]
 */
const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const { Project } = require("ts-morph");

program
  .requiredOption("-s, --src-dir <dir>", "Source directory to scan", "src")
  .requiredOption("-o, --out <file>", "Output AsyncAPI JSON file")
  .requiredOption("-t, --title <title>", "AsyncAPI document title")
  .option("-v, --version <ver>", "AsyncAPI document version", "1.0.0")
  .requiredOption("-c, --service <name>", "Service name for channels")
  .parse(process.argv);

const opts = program.opts();
const projectRoot = process.cwd();
const srcDir = path.resolve(projectRoot, opts.srcDir);
const outPath = path.resolve(projectRoot, opts.out);

// Initialize ts-morph project using existing tsconfig
const project = new Project({
  tsConfigFilePath: path.resolve(projectRoot, "tsconfig.json"),
});
project.addSourceFilesAtPaths(path.join(srcDir, "**/*.ts"));

const channels = {};

// Scan for @MessagePattern decorators on methods
for (const sourceFile of project.getSourceFiles()) {
  for (const cls of sourceFile.getClasses()) {
    for (const method of cls.getMethods()) {
      const decorator = method.getDecorator("MessagePattern");
      if (!decorator) continue;
      const args = decorator.getArguments();
      let pattern;
      if (args.length > 0) {
        pattern = args[0].getText().replace(/['"`]/g, "");
      } else {
        pattern = `${opts.service}.${cls.getName()}.${method.getName()}`;
      }
      if (!pattern) continue;

      // Build simple payload schemas
      const methodName = method.getName();
      channels[pattern] = {
        subscribe: {
          operationId: methodName,
          message: {
            name: methodName,
            title: `${methodName} message`,
            contentType: "application/json",
            payload: { type: "object" },
          },
        },
        publish: {
          operationId: `${methodName}Response`,
          message: {
            name: `${methodName}Response`,
            title: `${methodName} response message`,
            contentType: "application/json",
            payload: { type: "object" },
          },
        },
      };
    }
  }
}

// Compose AsyncAPI spec
const asyncapiSpec = {
  asyncapi: "2.6.0",
  info: {
    title: opts.title,
    version: opts.version,
  },
  servers: {
    nats: {
      url: process.env.NATS_URL || "nats://localhost:4222",
      protocol: "nats",
    },
  },
  channels,
};

// Write output
fs.writeFileSync(outPath, JSON.stringify(asyncapiSpec, null, 2));
console.log(`AsyncAPI spec written to ${outPath}`);
