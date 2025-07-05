import { z } from "zod";
import { getReference, hasReference, RelationshipType } from "./reference";

// Create test schemas
const AuthorSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    bio: z.string().optional(),
  })
  .describe("An author with name and bio");

const BookSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    authorId: z.string(),
    publishedYear: z.number().optional(),
  })
  .describe("A book with title and author");

describe("ONE_TO_MANY Relationship Tests", () => {
  describe("ZodArray ONE_TO_MANY references", () => {
    it("should create a ONE_TO_MANY relationship with explicit type", () => {
      // Author has many books (represented as an array of book IDs)
      const schema = z.object({
        bookIds: z.array(z.string()).reference({
          schema: BookSchema,
          type: RelationshipType.ONE_TO_MANY,
        }),
      });

      const reference = getReference(schema.shape.bookIds);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(BookSchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("book");
      expect(reference?.type).toBe(RelationshipType.ONE_TO_MANY);
    });

    it("should support custom field and name in ONE_TO_MANY relationship", () => {
      const schema = z.object({
        publishedBooks: z.array(z.string()).reference({
          schema: BookSchema,
          foreignField: "title",
          name: "publication",
          type: RelationshipType.ONE_TO_MANY,
        }),
      });

      const reference = getReference(schema.shape.publishedBooks);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(BookSchema);
      expect(reference?.foreignField).toBe("title");
      expect(reference?.name).toBe("publication");
      expect(reference?.type).toBe(RelationshipType.ONE_TO_MANY);
    });
  });

  describe("Practical ONE_TO_MANY examples", () => {
    it("should model an Author-Books one-to-many relationship", () => {
      // In a real application, an Author would have many Books
      const AuthorSchemaWithBooks = z.object({
        _id: z.string(),
        name: z.string(),
        bio: z.string().optional(),
        bookIds: z.array(z.string()).reference({
          schema: BookSchema,
          type: RelationshipType.ONE_TO_MANY,
        }),
      });

      const reference = getReference(AuthorSchemaWithBooks.shape.bookIds);

      expect(hasReference(AuthorSchemaWithBooks.shape.bookIds)).toBe(true);
      expect(reference?.type).toBe(RelationshipType.ONE_TO_MANY);
      expect(reference?.name).toBe("book");
    });

    it("should model a Department-Employees one-to-many relationship", () => {
      // Department schema
      const DepartmentSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
        })
        .describe("A department in a company");

      // Employee schema
      const EmployeeSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
          departmentId: z.string(),
        })
        .describe("An employee in a department");

      // Department with employees
      const DepartmentWithEmployeesSchema = z.object({
        _id: z.string(),
        name: z.string(),
        employeeIds: z.array(z.string()).reference({
          schema: EmployeeSchema,
          type: RelationshipType.ONE_TO_MANY,
          name: "employee",
        }),
      });

      const reference = getReference(
        DepartmentWithEmployeesSchema.shape.employeeIds
      );

      expect(reference?.type).toBe(RelationshipType.ONE_TO_MANY);
      expect(reference?.name).toBe("employee");
    });
  });
});
