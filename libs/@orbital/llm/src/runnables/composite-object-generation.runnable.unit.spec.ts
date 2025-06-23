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
      .mockImplementation(async (input: any) => input);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates only root when no nested inputs provided", async () => {
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "root only",
    });
    const rootInput = { x: 1, y: 2 };
    const result = await composite.invoke(rootInput, {});
    expect(invokeSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rootInput);
  });

  it("skips nested generation when child type is not registered", async () => {
    // Remove Child registration to simulate missing schema
    schemaRegistry.delete("Child");
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "no child",
    });
    const rootInput = { a: 1 };
    const nestedInputs = { child: { id: 5 } };
    const result = await composite.invoke(rootInput, nestedInputs);
    expect(invokeSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rootInput);
  });

  it("generates and merges nested object when child type is registered", async () => {
    // ChildType is already decorated and registered
    const composite = new CompositeObjectGenerationRunnable(RootType, {
      model: {} as any,
      systemPrompt: "with child",
    });
    const rootInput = { hello: "world" };
    const nestedInputs = { child: { id: 5 } };
    const result = await composite.invoke(rootInput, nestedInputs);
    expect(invokeSpy).toHaveBeenCalledTimes(2);
    // Root invocation should exclude the nested path
    expect(invokeSpy).toHaveBeenNthCalledWith(
      1,
      rootInput,
      expect.objectContaining({ exclude: ["child"] })
    );
    // Nested invocation uses the provided nested input
    expect(invokeSpy).toHaveBeenNthCalledWith(
      2,
      nestedInputs.child,
      expect.any(Object)
    );
    expect(result).toEqual({
      hello: "world",
      child: { id: 5 },
    });
  });
});
