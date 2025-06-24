#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
// @ts-ignore
import { AsyncAPIGenerator } from "@asyncapi/generator";

interface GenerateOptions {
  input: string;
  output: string;
  template?: string;
  templateParams?: Record<string, string>;
}

/**
 * Generate client code from an AsyncAPI document
 */
async function generateClients(options: GenerateOptions): Promise<void> {
  try {
    // Ensure input file exists
    if (!fs.existsSync(options.input)) {
      console.error(`Input file not found: ${options.input}`);
      process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }

    // Load AsyncAPI document
    const document = JSON.parse(fs.readFileSync(options.input, "utf8"));

    // Use default template if not specified
    const template = options.template || "@asyncapi/html-template";

    // Generate client code
    const generator = new AsyncAPIGenerator(template, options.output, {
      templateParams: options.templateParams || {},
    });

    console.log(
      `Generating clients from ${options.input} using ${template}...`
    );
    await generator.generate(document);
    console.log(`Client code generated successfully in ${options.output}`);
  } catch (error) {
    console.error("Error generating client code:", error);
    process.exit(1);
  }
}

// Set up CLI
const program = new Command();

program
  .name("generate-asyncapi")
  .description("Generate client code from AsyncAPI documents")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate client code from an AsyncAPI document")
  .requiredOption(
    "-i, --input <path>",
    "Path to AsyncAPI document (JSON or YAML)"
  )
  .requiredOption("-o, --output <path>", "Output directory for generated code")
  .option("-t, --template <name>", "Template to use for code generation")
  .option("-p, --params <params>", "Template parameters (JSON string)")
  .action((cmd) => {
    const options: GenerateOptions = {
      input: cmd.input,
      output: cmd.output,
      template: cmd.template,
      templateParams: cmd.params ? JSON.parse(cmd.params) : undefined,
    };
    generateClients(options).catch((err) => {
      console.error("Failed to generate clients:", err);
      process.exit(1);
    });
  });

program.parse(process.argv);
