import { z } from "zod";

/**
 * Converts a Zod schema to a JSON Schema compatible with AsyncAPI
 */
export function zodToAsyncAPISchema(schema: z.ZodType<any>): any {
  // This is a simplified implementation
  // A complete implementation would handle all Zod schema types

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToJsonSchema(value as z.ZodType<any>);

      // Check if property is required
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodTypeToJsonSchema(schema._def.type),
    };
  }

  return zodTypeToJsonSchema(schema);
}

/**
 * Helper function to convert Zod types to JSON Schema types
 */
function zodTypeToJsonSchema(zodType: z.ZodType<any>): any {
  if (zodType instanceof z.ZodString) {
    return { type: "string" };
  }

  if (zodType instanceof z.ZodNumber) {
    return { type: "number" };
  }

  if (zodType instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  if (zodType instanceof z.ZodNull) {
    return { type: "null" };
  }

  if (zodType instanceof z.ZodOptional) {
    return zodTypeToJsonSchema(zodType._def.innerType);
  }

  if (zodType instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: zodType._def.values,
    };
  }

  if (zodType instanceof z.ZodUnion) {
    return {
      oneOf: zodType._def.options.map((option: z.ZodType<any>) =>
        zodTypeToJsonSchema(option)
      ),
    };
  }

  if (zodType instanceof z.ZodIntersection) {
    return {
      allOf: [
        zodTypeToJsonSchema(zodType._def.left),
        zodTypeToJsonSchema(zodType._def.right),
      ],
    };
  }

  if (zodType instanceof z.ZodRecord) {
    return {
      type: "object",
      additionalProperties: zodTypeToJsonSchema(zodType._def.valueType),
    };
  }

  // Default fallback
  return { type: "object" };
}
