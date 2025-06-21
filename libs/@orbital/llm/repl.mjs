#!/usr/bin/env node

// repl.mjs
// Load environment variables from .env
import "dotenv/config";

// Import Ollama model and our runnables
import repl from "repl";
import {
  setupOllamaTest,
  ObjectGenerationRunnable,
  CompositeObjectGenerationRunnable,
} from "@orbital/llm";
import * as Types from "@orbital/core";

// Initialize Ollama via setupOllamaTest and start REPL
const ollama = await setupOllamaTest();
const replServer = repl.start({ prompt: "orbital> " });

// Expose models, runnables, and types in REPL
replServer.context.models = { ollama };
replServer.context.ObjectGenerationRunnable = ObjectGenerationRunnable;
replServer.context.CompositeObjectGenerationRunnable =
  CompositeObjectGenerationRunnable;
replServer.context.types = Types;

console.log(
  "models.ollama, ObjectGenerationRunnable, CompositeObjectGenerationRunnable, and types are available in this REPL context."
);
