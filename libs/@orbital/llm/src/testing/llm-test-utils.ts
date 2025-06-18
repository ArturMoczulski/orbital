import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { LLMObjectGenerationService } from "../services/llm-object-generation.service";

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
}

/**
 * Default options for creating a test LLM
 */
export const DEFAULT_TEST_LLM_OPTIONS: TestLLMOptions = {
  baseUrl: "http://localhost:11434",
  model: "llama3.1:latest",
  temperature: 0.7,
  maxRetries: 3,
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
 * Creates an LLMObjectGenerationService instance for testing
 * @param model The language model to use
 * @param options Configuration options
 * @returns An LLMObjectGenerationService instance
 */
export function createLLMObjectGenerationService(
  model: BaseLanguageModel,
  options: TestLLMOptions = {}
): LLMObjectGenerationService {
  const mergedOptions = { ...DEFAULT_TEST_LLM_OPTIONS, ...options };

  return new LLMObjectGenerationService(model, {
    maxRetries: mergedOptions.maxRetries,
    logErrors: mergedOptions.logErrors,
  });
}

/**
 * Sets up a test environment with Ollama and LLMObjectGenerationService
 * This function checks if Ollama is available, creates a model and service,
 * and returns them for use in tests.
 *
 * @param options Configuration options
 * @returns A promise that resolves to an object containing the model and service
 * @throws Error if Ollama is not available
 */
export async function setupOllamaTest(
  options: TestLLMOptions = {}
): Promise<BaseLanguageModel> {
  // Check if Ollama is available
  const available = await checkOllamaAvailability(options.baseUrl);

  if (!available) {
    throw new Error(
      "Ollama is not available. Make sure Ollama is installed and running at " +
        `${options.baseUrl || DEFAULT_TEST_LLM_OPTIONS.baseUrl}. ` +
        "E2E tests require a running Ollama instance."
    );
  }

  // Create the Ollama model
  return createOllamaModel(options);
}

/**
 * Sets up a test environment with Ollama for E2E tests.
 * This function should be called in a beforeAll hook.
 *
 * @example
 * let model: BaseLanguageModel;
 * let service: LLMObjectGenerationService;
 *
 * beforeAll(async () => {
 *   model = await setupOllamaForTest();
 *   service = createLLMObjectGenerationService(model);
 * });
 *
 * @returns A promise that resolves to an initialized BaseLanguageModel
 */
export async function setupOllamaForTest(
  options: TestLLMOptions = {}
): Promise<BaseLanguageModel> {
  return await setupOllamaTest(options);
}

/**
 * Creates an LLMObjectGenerationService for testing.
 * This function should be called after setupOllamaForTest.
 *
 * @example
 * let model: BaseLanguageModel;
 * let service: LLMObjectGenerationService;
 *
 * beforeAll(async () => {
 *   model = await setupOllamaForTest();
 *   service = createLLMServiceForTest(model);
 * });
 *
 * @param model The language model to use
 * @param options Configuration options
 * @returns An initialized LLMObjectGenerationService
 */
export function createLLMServiceForTest(
  model: BaseLanguageModel,
  options: TestLLMOptions = {}
): LLMObjectGenerationService {
  return createLLMObjectGenerationService(model, options);
}
