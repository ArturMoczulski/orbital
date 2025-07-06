import { z } from "zod";
import {
  getReference,
  getSchemaName,
  hasReference,
  RelationshipType,
} from "./reference";

// Create test schemas
const TestPersonSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    age: z.number(),
  })
  .describe("A person with name and age");

const TestCompanySchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    employees: z.array(z.string()),
  })
  .describe("A company with employees");

describe("Zod Reference Extension Core Functionality", () => {
  describe("getSchemaName", () => {
    it("should extract name from schema description", () => {
      expect(getSchemaName(TestPersonSchema)).toBe("person");
      expect(getSchemaName(TestCompanySchema)).toBe("company");
    });

    it("should return 'item' for schemas with a name field but no description", () => {
      const SchemaWithoutDescription = z.object({
        name: z.string(),
        value: z.number(),
      });
      expect(getSchemaName(SchemaWithoutDescription)).toBe("item");
    });

    it("should return 'reference' for schemas without description or name field", () => {
      const SchemaWithoutNameField = z.object({
        title: z.string(),
        id: z.string(),
      });
      expect(getSchemaName(SchemaWithoutNameField)).toBe("reference");
    });

    it("should extract name from description ending with just the name", () => {
      const SimpleSchema = z
        .object({ id: z.string() })
        .describe("A simple object");
      expect(getSchemaName(SimpleSchema)).toBe("simple object");
    });
  });

  describe("hasReference", () => {
    it("should return true for ZodString schemas with reference metadata", () => {
      const schema = z.string().reference({ schema: TestPersonSchema });
      expect(hasReference(schema)).toBe(true);
    });

    it("should return true for ZodArray schemas with reference metadata", () => {
      const schema = z
        .array(z.string())
        .reference({ schema: TestPersonSchema });
      expect(hasReference(schema)).toBe(true);
    });

    it("should return false for schemas without reference metadata", () => {
      const schema = z.string();
      expect(hasReference(schema)).toBe(false);
      const arraySchema = z.array(z.string());
      expect(hasReference(arraySchema)).toBe(false);
    });

    it("should return false for non-string or non-array schemas", () => {
      const schema = z.number();
      expect(hasReference(schema)).toBe(false);
      const booleanSchema = z.boolean();
      expect(hasReference(booleanSchema)).toBe(false);
    });
  });

  describe("getReference", () => {
    it("should return reference metadata for ZodString schemas with reference metadata", () => {
      const schema = z.string().reference({
        schema: TestPersonSchema,
        foreignField: "name",
        name: "employee",
        type: RelationshipType.HAS_ONE,
      });

      const reference = getReference(schema);
      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(TestPersonSchema);
      expect(reference?.foreignField).toBe("name");
      expect(reference?.name).toBe("employee");
      expect(reference?.type).toBe(RelationshipType.HAS_ONE);
    });

    it("should return reference metadata for ZodArray schemas with reference metadata", () => {
      const schema = z.array(z.string()).reference({
        schema: TestCompanySchema,
        foreignField: "_id",
        name: "companies",
        type: RelationshipType.MANY_TO_MANY,
      });

      const reference = getReference(schema);
      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(TestCompanySchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("companies");
      expect(reference?.type).toBe(RelationshipType.MANY_TO_MANY);
    });

    it("should return undefined for schemas without reference metadata", () => {
      const schema = z.string();
      expect(getReference(schema)).toBeUndefined();
      const arraySchema = z.array(z.string());
      expect(getReference(arraySchema)).toBeUndefined();
    });
  });

  describe("Default values", () => {
    it("should use default foreignField '_id' when not specified", () => {
      const stringSchema = z.string().reference({ schema: TestPersonSchema });
      expect(getReference(stringSchema)?.foreignField).toBe("_id");

      const arraySchema = z
        .array(z.string())
        .reference({ schema: TestPersonSchema });
      expect(getReference(arraySchema)?.foreignField).toBe("_id");
    });

    it("should use default relationship type BELONGS_TO for ZodString when not specified", () => {
      const schema = z.string().reference({ schema: TestPersonSchema });
      expect(getReference(schema)?.type).toBe(RelationshipType.BELONGS_TO);
    });

    it("should use default relationship type HAS_MANY for ZodArray when not specified", () => {
      const schema = z
        .array(z.string())
        .reference({ schema: TestPersonSchema });
      expect(getReference(schema)?.type).toBe(RelationshipType.HAS_MANY);
    });

    it("should derive name from schema description when not specified", () => {
      const stringSchema = z.string().reference({ schema: TestPersonSchema });
      expect(getReference(stringSchema)?.name).toBe("person");

      const arraySchema = z
        .array(z.string())
        .reference({ schema: TestCompanySchema });
      expect(getReference(arraySchema)?.name).toBe("company");
    });
  });
});
