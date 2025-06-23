# @orbital/llm

Provides runnables for generating structured objects using LLMs.

## Classes

### ObjectGenerationRunnable

**Source**: [`object-generation.runnable.ts`](libs/@orbital/llm/src/runnables/object-generation.runnable.ts)

#### Overview

`ObjectGenerationRunnable<In,Out>` wraps a `BaseLanguageModel` to generate JSON objects that strictly match a Zod schema.

#### Constructor

```ts
new ObjectGenerationRunnable<In, Out>(
  type: new (...args: any[]) => any,
  opts: ObjectGenerationRunnableOptions<In, Out>
)
```

**Options** (`ObjectGenerationRunnableOptions<In,Out>`):

- `model: BaseLanguageModel` (required)
- `inputSchema?: ZodSchema<In>`
- `outputSchema?: ZodSchema<Out>`
- `schemaRegistry?: typeof zodSchemaRegistry`
- `promptRepository?: IObjectGenerationPromptRepository`
- `systemPrompt?: string`
- `systemPromptKey?: string`
- `maxAttempts?: number` (default 3)
- `messageHistoryStore?: (sessionId: string) => BaseChatMessageHistory`
- `logger?: Logger`

#### Methods

- `invoke(input: In, config: RunnableConfig & {exclude?: string[]}): Promise<Out>`
- `batch(inputs: In[], configs?: RunnableConfig[] | RunnableConfig): Promise<Out[]>`
- `clearHistory(sessionId: string): Promise<void>`
- `clearAllHistories(): Promise<void>`
- `updateSystemPrompt(additionalPrompt: string): void`

#### Example

```ts
import { z } from "zod";
import { ObjectGenerationRunnable } from "@orbital/llm";
import { OpenAI } from "@langchain/core/language_models";

const townSchema = z.object({
  name: z.string(),
  population: z.number(),
  description: z.string(),
  pointsOfInterest: z.array(z.string()),
});

interface TownInput {
  climate: string;
  temperature: number;
  friendliness: "low" | "medium" | "high";
}

const model = new OpenAI({ temperature: 0 });
const runnable = new ObjectGenerationRunnable<
  TownInput,
  z.infer<typeof townSchema>
>(class Town {}, {
  model,
  inputSchema: z.any(),
  outputSchema: townSchema,
  systemPrompt: "You are a generator of realistic fantasy towns.",
});

const result = await runnable.invoke(
  { climate: "snowy", temperature: -10, friendliness: "low" },
  { configurable: { sessionId: "example-session" } }
);
console.log(result);
```

---

### CompositeObjectGenerationRunnable

**Source**: [`composite-object-generation.runnable.ts`](libs/@orbital/llm/src/runnables/composite-object-generation.runnable.ts)

#### Overview

`CompositeObjectGenerationRunnable<T>` orchestrates root and nested object generation in multiple steps, merging results into a single composite object.

#### Constructor

```ts
new CompositeObjectGenerationRunnable<T>(
  type: new (...args: any[]) => T,
  options?: ObjectGenerationRunnableOptions<any, any>
)
```

#### Methods

- `invoke(
  rootInput: any,
  nestedInputs: Record<string, any | ObjectGenerationRunnable<any, any>>,
  config?: RunnableConfig & { verbose?: boolean }
): Promise<T & { _verbose?: Record<string, any> }>`

Performs:

1. Generates a root object, excluding nested paths.
2. Generates each nested object via its runnable.
3. Merges nested results into the root.
4. Optionally captures verbose data in `_verbose`.

#### Example

```ts
import { CompositeObjectGenerationRunnable } from "@orbital/llm";

const kingdomGenerator = new CompositeObjectGenerationRunnable<Kingdom>(
  class Kingdom {},
  {
    model: openAIModel,
    systemPrompt: "You are a generator of fantasy kingdoms.",
    outputSchema: kingdomSchema,
  }
);

const nestedInputs = {
  capital: { size: "large", importance: "medium", specialization: "trade" },
  "cities[0]": { size: "small", importance: "low", specialization: "farming" },
};

const compositeResult = await kingdomGenerator.invoke(
  { climate: "temperate", terrain: "plains", culture: "medieval", age: "new" },
  nestedInputs,
  { configurable: { sessionId: "comp-session" }, verbose: true }
);

console.log(compositeResult);
console.log(compositeResult._verbose);
```
