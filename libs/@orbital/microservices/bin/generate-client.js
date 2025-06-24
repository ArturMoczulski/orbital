#!/usr/bin/env node
/**
 * CLI to generate both AsyncAPI JSON spec and proxy client from a NestJS service.
 * This script combines the functionality of generate-spec.js and generate-proxy.js.
 *
 * Usage:
 *   orbital-ms-client \
 *     [--entry path/to/dist/main.js] \
 *     [--spec-out path/to/asyncapi.json] \
 *     [--proxy-out path/to/output/dir] \
 *     [--title "Service Name"] \
 *     [--version "1.0.0"] \
 *     [--service "serviceName"]
 *
 * All parameters have sensible defaults based on the current package:
 * - entry: dist/app.module.js
 * - spec-out: ../../../libs/{package-name}-rpc/asyncapi.json
 * - proxy-out: ../../../libs/{package-name}-rpc/src
 * - title: {Package Name}
 * - service: {package name without owner}
 */
const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

// Get package info from the current working directory
function getPackageInfo() {
  try {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const packageName = packageJson.name || "";

    // Parse package name
    let serviceName = packageName;

    // If package has an owner (e.g., @orbital/world), extract the part after the owner
    if (packageName.startsWith("@") && packageName.includes("/")) {
      serviceName = packageName.split("/")[1];
    }

    return {
      packageName,
      serviceName,
      packageVersion: packageJson.version || "1.0.0",
    };
  } catch (error) {
    console.error("Error reading package.json:", error.message);
    process.exit(1);
  }
}

const packageInfo = getPackageInfo();

// Set default values based on package info
const defaultEntry = "dist/app.module.js";

// Handle package names with @ symbol correctly
// For @orbital/world, we want ../../../libs/@orbital/world-rpc/...
let rpcPackagePath = packageInfo.packageName;
if (rpcPackagePath.startsWith("@")) {
  // Keep the @ symbol and replace / with /@ to maintain directory structure
  const parts = rpcPackagePath.split("/");
  if (parts.length === 2) {
    rpcPackagePath = `${parts[0]}/${parts[1]}-rpc`;
  } else {
    rpcPackagePath = `${rpcPackagePath}-rpc`;
  }
} else {
  rpcPackagePath = `${rpcPackagePath}-rpc`;
}

const defaultSpecOut = `../../../libs/${rpcPackagePath}/asyncapi.json`;
const defaultProxyOut = `../../../libs/${rpcPackagePath}/src`;
const defaultTitle = packageInfo.packageName;
const defaultService = packageInfo.serviceName;

program
  .description("Generate AsyncAPI spec and proxy client from a NestJS service")
  .option("-e, --entry <file>", "Path to compiled module entry", defaultEntry)
  .option("-s, --spec-out <file>", "Output AsyncAPI JSON file", defaultSpecOut)
  .option(
    "-p, --proxy-out <dir>",
    "Output directory for proxy client",
    defaultProxyOut
  )
  .option("-t, --title <title>", "AsyncAPI document title", defaultTitle)
  .option(
    "-v, --version <ver>",
    "AsyncAPI document version",
    packageInfo.packageVersion
  )
  .option(
    "--service <name>",
    "Service name for proxy generation",
    defaultService
  )
  .parse(process.argv);

const opts = program.opts();

console.log("Using configuration:");
console.log(`- Entry: ${opts.entry}`);
console.log(`- Spec Output: ${opts.specOut}`);
console.log(`- Proxy Output: ${opts.proxyOut}`);
console.log(`- Title: ${opts.title}`);
console.log(`- Version: ${opts.version}`);
console.log(`- Service: ${opts.service}`);

// Resolve paths to the generate-spec.js and generate-proxy.js scripts
const generateSpecPath = path.resolve(__dirname, "generate-spec.js");
const generateProxyPath = path.resolve(__dirname, "generate-proxy.js");

// Ensure the scripts exist
if (!fs.existsSync(generateSpecPath)) {
  console.error(
    `Error: generate-spec.js script not found at ${generateSpecPath}`
  );
  process.exit(1);
}

if (!fs.existsSync(generateProxyPath)) {
  console.error(
    `Error: generate-proxy.js script not found at ${generateProxyPath}`
  );
  process.exit(1);
}

console.log("Starting client generation process...");

// Step 1: Generate AsyncAPI spec
console.log("\n=== Generating AsyncAPI Specification ===");
const specResult = spawnSync(
  "node",
  [
    generateSpecPath,
    "--entry",
    opts.entry,
    "--out",
    opts.specOut,
    "--title",
    opts.title,
    "--version",
    opts.version,
  ],
  { stdio: "inherit" }
);

if (specResult.status !== 0) {
  console.error("Error generating AsyncAPI specification");
  process.exit(specResult.status || 1);
}

// Step 2: Generate proxy client
console.log("\n=== Generating Proxy Client ===");
const proxyResult = spawnSync(
  "node",
  [
    generateProxyPath,
    "--input",
    opts.specOut,
    "--output",
    opts.proxyOut,
    "--service",
    opts.service,
  ],
  { stdio: "inherit" }
);

if (proxyResult.status !== 0) {
  console.error("Error generating proxy client");
  process.exit(proxyResult.status || 1);
}

console.log("\n=== Client Generation Completed Successfully ===");
console.log(`AsyncAPI Spec: ${opts.specOut}`);
console.log(
  `Proxy Client: ${path.join(opts.proxyOut, `${opts.service}.microservice.ts`)}`
);
console.log(`Index File: ${path.join(opts.proxyOut, "index.ts")}`);
