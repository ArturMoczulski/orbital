# @orbital/world-builder

A package for procedurally generating game world elements using LangChain and LLMs.

## Features

- Generate detailed game areas with LLMs
- Create connected regions with multiple areas
- Customize generation with themes, moods, and purposes
- Provider-agnostic: works with any LangChain-compatible language model

## Installation

```bash
# Install the package
npm install @orbital/world-builder

# Install your preferred LLM provider package(s)
npm install @langchain/openai    # For OpenAI
# OR
npm install @langchain/anthropic # For Anthropic
# OR
npm install @langchain/cohere    # For Cohere
# OR
npm install @langchain/google-genai # For Google AI
# OR
npm install @langchain/community # For Ollama and other community models

# Create a .env file with your API key(s)
cp .env.template .env
# Then edit .env to add your actual API key(s)
```

## Testing

The package includes both unit tests and end-to-end tests:

```bash
# Run unit tests
yarn test:unit

# Run E2E tests with Ollama (requires Ollama to be running)
# Note: E2E tests are skipped by default to avoid requiring external dependencies
# Remove the .skip in the test file to enable them
yarn test -- -t "E2E: AreaGenerator"

# Run E2E tests with verbose logging
# This will show detailed output of generated areas
VERBOSE_TEST=true yarn test -- -t "E2E: AreaGenerator"
```

The E2E tests use the `logVerbose` utility from `@orbital/testing` to provide detailed logging when the `VERBOSE_TEST` environment variable is set to `true`.

## Usage

### AreaGenerator

The `AreaGenerator` class uses LangChain and any LLM provider to generate detailed game areas.

```typescript
import { AreaGenerator } from "@orbital/world-builder";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Cohere } from "@langchain/cohere";
import { GoogleGenerativeAI } from "@langchain/google-genai";

// Create a language model with your preferred provider
// Example with OpenAI:
const openaiModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
});

// Or use Anthropic:
const anthropicModel = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  modelName: "claude-2",
  temperature: 0.7,
});

// Or use Cohere:
const cohereModel = new Cohere({
  apiKey: process.env.COHERE_API_KEY,
  model: "command",
  temperature: 0.7,
});

// Or use Google AI:
const googleModel = new GoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-pro",
  temperature: 0.7,
});

// Or use Ollama (local LLM):
import { ChatOllama } from "@langchain/community/chat_models/ollama";
const ollamaModel = new ChatOllama({
  baseUrl: "http://localhost:11434", // Default Ollama URL
  model: "llama2", // Or any other model you've pulled
  temperature: 0.7,
});

// Create an AreaGenerator with your chosen model
const generator = new AreaGenerator({ model: openaiModel });

// Generate a single area
const fantasyArea = await generator.generateArea({
  theme: "medieval fantasy",
  mood: "mysterious",
  purpose: "hidden treasure location",
  additionalDetails:
    "This area should have ancient ruins and magical elements.",
});

// Generate a region with multiple connected areas
const scifiRegion = await generator.generateRegion(
  {
    theme: "futuristic space station",
    mood: "tense",
    purpose: "research facility",
  },
  3
); // Generate 3 connected areas
```

## API Reference

### AreaGenerator

```typescript
class AreaGenerator {
  // Create a new instance with a language model
  constructor(options: AreaGeneratorOptions);

  // Generate a single area
  async generateArea(prompt: AreaGenerationPrompt): Promise<Area>;

  // Generate multiple connected areas
  async generateRegion(
    basePrompt: AreaGenerationPrompt,
    count?: number
  ): Promise<Area[]>;
}
```

### AreaGeneratorOptions

```typescript
interface AreaGeneratorOptions {
  model: BaseLanguageModel; // Any LangChain-compatible language model
}
```

### AreaGenerationPrompt

```typescript
interface AreaGenerationPrompt {
  theme?: string; // Theme or setting (e.g., "medieval castle")
  mood?: string; // Mood or atmosphere (e.g., "eerie")
  purpose?: string; // Purpose or function (e.g., "marketplace")
  additionalDetails?: string; // Any additional details or constraints
}
```
