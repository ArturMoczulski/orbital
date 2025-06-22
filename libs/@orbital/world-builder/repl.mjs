#!/usr/bin/env node

// repl.mjs for @orbital/world-builder
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });
import repl from "repl";
import { ChatOpenAI } from "@langchain/openai";
import {
  setupOllamaTest,
  ObjectGenerationRunnable,
  CompositeObjectGenerationRunnable,
} from "@orbital/llm";
// Import prompt repository from built package
import { ObjectGenerationPromptRepository } from "@orbital/world-builder";
import * as Types from "@orbital/core";
import { generateArea } from "@orbital/world-builder";

(async () => {
  // Instantiate Ollama for testing
  const ollama = await setupOllamaTest();
  // Instantiate OpenAI model
  const openai = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4",
    temperature: 0.2,
  });

  // Instantiate prompt repository
  const promptRepo = new ObjectGenerationPromptRepository();

  // Start REPL
  const replServer = repl.start({ prompt: "world-builder> " });

  // Expose models, runnables, prompts, and types in REPL context
  replServer.context.models = { ollama, openai };
  replServer.context.ObjectGenerationRunnable = ObjectGenerationRunnable;
  replServer.context.CompositeObjectGenerationRunnable =
    CompositeObjectGenerationRunnable;
  replServer.context.promptRepo = promptRepo;
  replServer.context.types = Types;
  replServer.context.generateArea = generateArea;

  console.log(
    "models.ollama, ObjectGenerationRunnable, CompositeObjectGenerationRunnable, promptRepo, types, and generateArea are available in this REPL context."
  );
})();
