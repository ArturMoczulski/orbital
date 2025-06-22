import { IObjectGenerationPromptRepository } from "@orbital/llm";
import * as fs from "fs";
import * as path from "path";

// Load prompts from prompts.json at package root
const promptsPath = path.resolve(__dirname, "../prompts.json");
const raw = fs.readFileSync(promptsPath, "utf-8");
const prompts: Record<string, string> = JSON.parse(raw);

/**
 * Repository for object generation prompts.
 */
export class ObjectGenerationPromptRepository
  implements IObjectGenerationPromptRepository
{
  inferKey(typeName: string): string {
    // Use the exact typeName as key
    return typeName;
  }

  get(key: string): string {
    const prompt = prompts[key];
    if (!prompt) {
      throw new Error(`Prompt not found for key: ${key}`);
    }
    return prompt;
  }
}
export const promptRepository = new ObjectGenerationPromptRepository();
