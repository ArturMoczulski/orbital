import { z } from "zod";
import { ZodSchema } from "@orbital/core";
import { schemaRegistry } from "@orbital/core/src/registry";
import { ObjectGenerationRunnable } from "./object-generation.runnable";
import { CompositeObjectGenerationRunnable } from "./composite-object-generation.runnable";

@ZodSchema(z.object({}))
class RootType {}

@ZodSchema(z.object({ id: z.number() }))
class Child {}

describe("CompositeObjectGenerationRunnable", () => {
  let invokeSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset registry and re-register decorated classes
    schemaRegistry.clear();
    schemaRegistry.set(RootType.name, { ctor: RootType, schema: z.object({}) });
    schemaRegistry.set(Child.name, {
      ctor: Child,
      schema: z.object({ id: z.number() }),
    });
    // Spy on the core runnable invoke method
    invokeSpy = jest
      .spyOn(ObjectGenerationRunnable.prototype, "invoke")
      .mockImplementation(async (input: any, config?: any) => {
        // For the root object generation, filter out any properties that are in the exclude list
        if (config?.exclude) {
          const filteredInput = { ...input };
          for (const key of config.exclude) {
            delete filteredInput[key];
          }
          return filteredInput;
        }
        return input;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates only root when no nested inputs provided", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "root only",
    });
    const input = { x: 1, y: 2 };
    const result = await composite.invoke(input);
    expect(invokeSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(input);
  });

  it("skips nested generation when child type is not registered", async () => {
    // Remove Child registration to simulate missing schema
    schemaRegistry.delete("Child");
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "no child",
    });
    const input = {
      a: 1,
      child: { id: 5 },
    };
    const result = await composite.invoke(input);
    expect(invokeSpy).toHaveBeenCalledTimes(1);
    // Only the root properties should be in the result since child type is not registered
    expect(result).toEqual({ a: 1 });
  });

  it("generates and merges nested object when child type is registered", async () => {
    // ChildType is already decorated and registered
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "with child",
    });
    const input = {
      hello: "world",
      child: { id: 5 },
    };
    const result = await composite.invoke(input);
    expect(invokeSpy).toHaveBeenCalledTimes(2);
    // Root invocation should exclude the nested path
    // The first call should be with just the root properties
    expect(invokeSpy.mock.calls[0][0]).toEqual({ hello: "world" });
    expect(invokeSpy.mock.calls[0][1]).toEqual(
      expect.objectContaining({ exclude: ["child"] })
    );
    // Nested invocation uses the provided nested input
    expect(invokeSpy).toHaveBeenNthCalledWith(2, { id: 5 }, expect.any(Object));
    expect(result).toEqual({
      hello: "world",
      child: { id: 5 },
    });
  });
});
