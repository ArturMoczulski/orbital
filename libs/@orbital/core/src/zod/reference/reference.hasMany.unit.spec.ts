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

describe("HAS_MANY Relationship Tests", () => {
  describe("ZodArray HAS_MANY references", () => {
    it("should create a HAS_MANY relationship with explicit type", () => {
      // Author has many books (represented as an array of book IDs)
      const schema = z.object({
        bookIds: z.array(z.string()).reference({
          schema: BookSchema,
          type: RelationshipType.HAS_MANY,
        }),
      });

      const reference = getReference(schema.shape.bookIds);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(BookSchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("book");
      expect(reference?.type).toBe(RelationshipType.HAS_MANY);
    });

    it("should support custom field and name in HAS_MANY relationship", () => {
      const schema = z.object({
        publishedBooks: z.array(z.string()).reference({
          schema: BookSchema,
          foreignField: "title",
          name: "publication",
          type: RelationshipType.HAS_MANY,
        }),
      });

      const reference = getReference(schema.shape.publishedBooks);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(BookSchema);
      expect(reference?.foreignField).toBe("title");
      expect(reference?.name).toBe("publication");
      expect(reference?.type).toBe(RelationshipType.HAS_MANY);
    });
  });

  describe("Practical HAS_MANY examples", () => {
    it("should model an Author-Books has-many relationship", () => {
      // In a real application, an Author would have many Books
      const AuthorSchemaWithBooks = z.object({
        _id: z.string(),
        name: z.string(),
        bio: z.string().optional(),
        bookIds: z.array(z.string()).reference({
          schema: BookSchema,
          type: RelationshipType.HAS_MANY,
        }),
      });

      const reference = getReference(AuthorSchemaWithBooks.shape.bookIds);

      expect(hasReference(AuthorSchemaWithBooks.shape.bookIds)).toBe(true);
      expect(reference?.type).toBe(RelationshipType.HAS_MANY);
      expect(reference?.name).toBe("book");
    });

    it("should model a Department-Employees has-many relationship", () => {
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
          type: RelationshipType.HAS_MANY,
          name: "employee",
        }),
      });

      const reference = getReference(
        DepartmentWithEmployeesSchema.shape.employeeIds
      );

      expect(reference?.type).toBe(RelationshipType.HAS_MANY);
      expect(reference?.name).toBe("employee");
    });
  });
});
