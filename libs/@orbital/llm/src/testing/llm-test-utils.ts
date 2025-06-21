import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Logger } from "@orbital/core";

/**
 * Configuration options for creating a test LLM
 */
export interface TestLLMOptions {
  /** The base URL for the Ollama API */
  baseUrl?: string;
  /** The model to use */
  model?: string;
  /** The temperature to use for generation (0.0 to 1.0) */
  temperature?: number;
  /** Maximum number of retries for LLM generation */
  maxRetries?: number;
  /** Whether to log errors during generation */
  logErrors?: boolean;
  /** Logger to use for logging */
  logger?: Logger;
}

/**
 * Default options for creating a test LLM
 */
export const DEFAULT_TEST_LLM_OPTIONS: TestLLMOptions = {
  baseUrl: "http://localhost:11434",
  model: "gemma3:latest",
  temperature: 0.2, // Lower temperature for more predictable outputs
  maxRetries: 5, // Increase max retries
  logErrors: true,
};

/**
 * Checks if Ollama is available at the specified URL
 * @param baseUrl The base URL to check
 * @returns A promise that resolves to true if Ollama is available, false otherwise
 */
export async function checkOllamaAvailability(
  baseUrl: string = DEFAULT_TEST_LLM_OPTIONS.baseUrl!
): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Creates a ChatOllama instance for testing
 * @param options Configuration options
 * @returns A ChatOllama instance
 */
export function createOllamaModel(
  options: TestLLMOptions = {}
): BaseLanguageModel {
  const mergedOptions = { ...DEFAULT_TEST_LLM_OPTIONS, ...options };

  return new ChatOllama({
    baseUrl: mergedOptions.baseUrl,
    model: mergedOptions.model,
    temperature: mergedOptions.temperature,
  });
}

/**
 * Sets up a test environment with Ollama and LLMObjectGenerationService
 * This function checks if Ollama is available, creates a model and service,
 * and returns them for use in tests.
 *
 * @param options Configuration options
 * @returns A promise that resolves to a BaseLanguageModel
 * @throws Error if Ollama is not available
 */
export async function setupOllamaTest(
  options: TestLLMOptions = {}
): Promise<BaseLanguageModel> {
  const available = await checkOllamaAvailability(options.baseUrl);

  if (!available) {
    throw new Error(
      "Ollama is not available. Make sure Ollama is installed and running at " +
        `${options.baseUrl || DEFAULT_TEST_LLM_OPTIONS.baseUrl}. ` +
        "E2E tests require a running Ollama instance."
    );
  }

  return createOllamaModel(options);
}

/**
 * @deprecated Use setupOllamaTest instead
 */
export async function setupOllamaForTest(
  options: TestLLMOptions = {}
): Promise<BaseLanguageModel> {
  console.warn(
    "setupOllamaForTest is deprecated. Use setupOllamaTest instead."
  );
  return await setupOllamaTest(options);
}
