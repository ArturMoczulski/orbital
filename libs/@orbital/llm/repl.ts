// repl.ts
// Load environment variables
import "dotenv/config";
import * as repl from "repl";

// Dynamically require the Ollama constructor
// @ts-ignore
const { Ollama } = require("langchain/llms/ollama");

// Import runnables from source
import {
  ObjectGenerationRunnable,
  CompositeObjectGenerationRunnable,
} from "./src/runnables";

// Start Node REPL
const server = repl.start({ prompt: "orbital> " });

// Expose in REPL context
if (Ollama) server.context.Ollama = Ollama;
server.context.ObjectGenerationRunnable = ObjectGenerationRunnable;
server.context.CompositeObjectGenerationRunnable =
  CompositeObjectGenerationRunnable;

console.log("Available in REPL context:");
if (Ollama) console.log("  Ollama");
console.log("  ObjectGenerationRunnable");
console.log("  CompositeObjectGenerationRunnable");
