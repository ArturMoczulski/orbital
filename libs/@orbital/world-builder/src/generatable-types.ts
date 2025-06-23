/* libs/@orbital/world-builder/src/generatable-types.ts */
import { schemaRegistry } from "@orbital/core";

/**
 * Get a list of types available for generation.
 * Looks for classes that have a corresponding {typeName}GenerationInput schema in the registry.
 */
export function getGeneratableTypes(): string[] {
  const availableTypes: string[] = [];

  for (const typeName of schemaRegistry.keys()) {
    const inputTypeName = `${typeName}GenerationInput`;
    if (schemaRegistry.has(inputTypeName)) {
      availableTypes.push(typeName);
      continue;
    }
  }

  return availableTypes;
}
