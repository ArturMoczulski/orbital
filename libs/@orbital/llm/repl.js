// repl.js
// Load environment variables from .env
require("dotenv").config();

// Import Ollama model and our runnables
// Import Ollama model and our runnables via the main langchain package
const { llms } = require("langchain");
const Ollama = llms.Ollama;

const { ObjectGenerationRunnable } = require("@orbital/llm");
const {
  CompositeObjectGenerationRunnable,
} = require("@orbital/llm/dist/runnables/composite-object-generation.runnable");

// Start Node REPL and expose these constructors in the REPL context
const repl = require("repl");
const replServer = repl.start({ prompt: "orbital> " });

// Expose imports in REPL
replServer.context.Ollama = Ollama;
replServer.context.ObjectGenerationRunnable = ObjectGenerationRunnable;
replServer.context.CompositeObjectGenerationRunnable =
  CompositeObjectGenerationRunnable;

console.log(
  "Ollama, ObjectGenerationRunnable, and CompositeObjectGenerationRunnable are available in this REPL context."
);
