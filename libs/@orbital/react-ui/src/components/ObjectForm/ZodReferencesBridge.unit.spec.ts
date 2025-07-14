// @ts-nocheck
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { z } from "zod";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

describe("ZodReferencesBridge", () => {
  // Sample schemas for testing
  const worldSchema = z
    .object({
      _id: z.string(),
      name: z.string(),
      description: z.string().optional(),
    })
    .describe("A world in the game universe");

  const areaSchema = z.object({
    _id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    worldId: z.string().reference({
      schema: worldSchema,
      type: RelationshipType.BELONGS_TO,
      name: "world",
    }),
    tags: z
      .array(z.string())
      .reference({
        schema: z.object({ _id: z.string(), name: z.string() }),
        type: RelationshipType.HAS_MANY,
        name: "tag",
      })
      .optional(),
    nested: z
      .object({
        regionId: z.string().reference({
          schema: z.object({ _id: z.string(), name: z.string() }),
          name: "region",
        }),
      })
      .optional(),
  });

  // Sample data for testing
  const worldData = [
    { _id: "world1", name: "Earth" },
    { _id: "world2", name: "Mars" },
  ];

  const tagData = [
    { _id: "tag1", name: "Fantasy" },
    { _id: "tag2", name: "Sci-Fi" },
  ];

  const regionData = [
    { _id: "region1", name: "North" },
    { _id: "region2", name: "South" },
  ];

  describe("constructor", () => {
    it("should initialize with schema and dependencies", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
        dependencies: {
          world: worldData,
          tag: tagData,
          region: regionData,
        },
      });

      expect(bridge).toBeDefined();
      expect(bridge.schema).toBe(areaSchema);
    });

    it("should initialize with schema only", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      expect(bridge).toBeDefined();
      expect(bridge.schema).toBe(areaSchema);
    });
  });

  describe("getField", () => {
    it("should add reference metadata to fields with references", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
        dependencies: {
          world: worldData,
        },
      });

      const field = bridge.getField("worldId");

      expect(field).toBeDefined();
      expect(field.reference).toBeDefined();
      expect(field.reference.name).toBe("world");
      expect(field.reference.type).toBe(RelationshipType.BELONGS_TO);
      expect(field.reference.options).toEqual(worldData);
      expect(field.uniforms).toBeDefined();
      expect(field.uniforms.component).toBe("ReferenceSingleField");
    });

    it("should add reference metadata to array fields with references", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
        dependencies: {
          tag: tagData,
        },
      });

      const field = bridge.getField("tags");

      expect(field).toBeDefined();
      expect(field.reference).toBeDefined();
      expect(field.reference.name).toBe("tag");
      expect(field.reference.type).toBe(RelationshipType.HAS_MANY);
      expect(field.reference.options).toEqual(tagData);
      expect(field.uniforms).toBeDefined();
      expect(field.uniforms.component).toBe("ReferenceArrayField");
    });

    it("should handle fields without references", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      const field = bridge.getField("name");

      expect(field).toBeDefined();
      expect(field.reference).toBeUndefined();
      expect(field.uniforms).toBeDefined();
      expect(field.uniforms.component).toBeUndefined();
    });

    it("should handle nested fields with references", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
        dependencies: {
          region: regionData,
        },
      });

      const field = bridge.getField("nested.regionId");

      expect(field).toBeDefined();
      expect(field.reference).toBeDefined();
      expect(field.reference.name).toBe("region");
      expect(field.reference.options).toEqual(regionData);
      expect(field.uniforms).toBeDefined();
      expect(field.uniforms.component).toBe("ReferenceSingleField");
    });

    it("should handle missing dependencies", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
        // No dependencies provided
      });

      const field = bridge.getField("worldId");

      expect(field).toBeDefined();
      expect(field.reference).toBeDefined();
      expect(field.reference.name).toBe("world");
      expect(field.reference.options).toEqual([]);
      expect(field.uniforms).toBeDefined();
      expect(field.uniforms.component).toBe("ReferenceSingleField");
    });
  });

  describe("getValidator", () => {
    it("should return a validator function", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      const validator = bridge.getValidator();
      expect(typeof validator).toBe("function");
    });

    it("should validate references when dependencies are provided", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
        dependencies: {
          world: worldData,
        },
      });

      const validator = bridge.getValidator();

      // Valid data
      const validData = {
        _id: "area1",
        name: "Test Area",
        worldId: "world1",
      };
      const validResult = validator(validData);
      expect(validResult).toBeNull();

      // Invalid reference
      const invalidData = {
        _id: "area2",
        name: "Test Area 2",
        worldId: "nonexistent",
      };
      const invalidResult = validator(invalidData);
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.issues.length).toBeGreaterThan(0);
      expect(invalidResult?.issues[0].message).toContain(
        "Referenced world with _id=nonexistent not found"
      );
    });

    it("should fall back to standard validation when no dependencies are provided", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      const validator = bridge.getValidator();

      // Valid data structure (references not validated)
      const validData = {
        _id: "area1",
        name: "Test Area",
        worldId: "nonexistent", // Would fail reference validation if dependencies were provided
      };
      const validResult = validator(validData);
      expect(validResult).toBeNull();

      // Invalid data structure
      const invalidData = {
        _id: "area2",
        // Missing required 'name' field
        worldId: "world1",
      };
      const invalidResult = validator(invalidData);
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("getSubschema", () => {
    // Testing private method through its effects
    it("should handle simple paths", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      const field = bridge.getField("name");
      expect(field).toBeDefined();
      expect(field.type).toBe("string");
    });

    it("should handle nested paths", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      const field = bridge.getField("nested.regionId");
      expect(field).toBeDefined();
      expect(field.type).toBe("string");
    });

    it("should return a generic schema for invalid paths", () => {
      const bridge = new ZodReferencesBridge({
        schema: areaSchema,
      });

      const field = bridge.getField("nonexistent.path");
      expect(field).toBeDefined();
      // The field will have a generic type since the path doesn't exist
      expect(field.type).toBeDefined();
    });
  });
});
