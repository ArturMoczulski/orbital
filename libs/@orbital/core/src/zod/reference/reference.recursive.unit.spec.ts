import { z } from "zod";
import { getReference, hasReference, RelationshipType } from "./reference";

describe("RECURSIVE Relationship Tests", () => {
  describe("ZodString RECURSIVE references", () => {
    it("should create a RECURSIVE relationship with explicit type", () => {
      // Define a base schema
      const NodeSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
        })
        .describe("A node in a tree structure");

      // Create a schema with a recursive reference
      const TreeNodeSchema = z.object({
        _id: z.string(),
        name: z.string(),
        parentId: z.string().reference({
          schema: NodeSchema,
          type: RelationshipType.RECURSIVE,
        }),
      });

      const reference = getReference(TreeNodeSchema.shape.parentId);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(NodeSchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("node in a tree structure");
      expect(reference?.type).toBe(RelationshipType.RECURSIVE);
    });

    it("should support custom field and name in RECURSIVE relationship", () => {
      // Define a base schema
      const EmployeeSchema = z
        .object({
          employeeId: z.string(),
          name: z.string(),
        })
        .describe("An employee in an organization");

      // Create a schema with a recursive reference
      const ManagerSchema = z.object({
        employeeId: z.string(),
        name: z.string(),
        managerId: z.string().reference({
          schema: EmployeeSchema,
          foreignField: "employeeId",
          name: "manager",
          type: RelationshipType.RECURSIVE,
        }),
      });

      const reference = getReference(ManagerSchema.shape.managerId);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(EmployeeSchema);
      expect(reference?.foreignField).toBe("employeeId");
      expect(reference?.name).toBe("manager");
      expect(reference?.type).toBe(RelationshipType.RECURSIVE);
    });
  });

  describe("ZodArray RECURSIVE references", () => {
    it("should create a RECURSIVE relationship for child items", () => {
      // Define a base schema
      const FolderSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
        })
        .describe("A folder in a file system");

      // Create a schema with a recursive reference
      const FolderWithChildrenSchema = z.object({
        _id: z.string(),
        name: z.string(),
        childFolderIds: z.array(z.string()).reference({
          schema: FolderSchema,
          type: RelationshipType.RECURSIVE,
          name: "folder",
        }),
      });

      const reference = getReference(
        FolderWithChildrenSchema.shape.childFolderIds
      );

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(FolderSchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("folder");
      expect(reference?.type).toBe(RelationshipType.RECURSIVE);
    });
  });

  describe("Practical RECURSIVE examples", () => {
    it("should model a hierarchical category structure", () => {
      // Define a category schema
      const CategorySchema = z
        .object({
          _id: z.string(),
          name: z.string(),
        })
        .describe("A category in a hierarchical structure");

      // Create a schema with a reference to itself
      const CategoryWithParentSchema = z.object({
        _id: z.string(),
        name: z.string(),
        parentId: z.string().reference({
          schema: CategorySchema,
          type: RelationshipType.RECURSIVE,
        }),
      });

      const reference = getReference(CategoryWithParentSchema.shape.parentId);

      expect(hasReference(CategoryWithParentSchema.shape.parentId)).toBe(true);
      expect(reference?.type).toBe(RelationshipType.RECURSIVE);
      expect(reference?.schema).toBe(CategorySchema);
    });

    it("should model a nested comment system", () => {
      // Define a comment schema
      const CommentSchema = z
        .object({
          _id: z.string(),
          text: z.string(),
          authorId: z.string(),
        })
        .describe("A comment in a discussion");

      // Create a schema with a reference to itself
      const CommentWithParentSchema = z.object({
        _id: z.string(),
        text: z.string(),
        authorId: z.string(),
        parentCommentId: z.string().reference({
          schema: CommentSchema,
          type: RelationshipType.RECURSIVE,
        }),
      });

      const reference = getReference(
        CommentWithParentSchema.shape.parentCommentId
      );

      expect(hasReference(CommentWithParentSchema.shape.parentCommentId)).toBe(
        true
      );
      expect(reference?.type).toBe(RelationshipType.RECURSIVE);
      expect(reference?.schema).toBe(CommentSchema);
    });

    it("should model an organizational chart", () => {
      // Define an employee schema
      const EmployeeSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
          position: z.string(),
        })
        .describe("An employee in an organization");

      // Create a schema with manager and direct reports
      const EmployeeWithRelationsSchema = z.object({
        _id: z.string(),
        name: z.string(),
        position: z.string(),
        managerId: z.string().reference({
          schema: EmployeeSchema,
          type: RelationshipType.RECURSIVE,
          name: "manager",
        }),
        directReportIds: z.array(z.string()).reference({
          schema: EmployeeSchema,
          type: RelationshipType.RECURSIVE,
          name: "directReport",
        }),
      });

      const managerReference = getReference(
        EmployeeWithRelationsSchema.shape.managerId
      );
      const reportsReference = getReference(
        EmployeeWithRelationsSchema.shape.directReportIds
      );

      expect(managerReference?.type).toBe(RelationshipType.RECURSIVE);
      expect(managerReference?.name).toBe("manager");

      expect(reportsReference?.type).toBe(RelationshipType.RECURSIVE);
      expect(reportsReference?.name).toBe("directReport");
    });

    it("should model a file system with folders and subfolders", () => {
      // Define a folder schema
      const FolderSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
        })
        .describe("A folder in a file system");

      // Create a schema with parent and children references
      const FolderWithRelationsSchema = z.object({
        _id: z.string(),
        name: z.string(),
        parentFolderId: z.string().reference({
          schema: FolderSchema,
          type: RelationshipType.RECURSIVE,
          name: "parentFolder",
        }),
        childFolderIds: z.array(z.string()).reference({
          schema: FolderSchema,
          type: RelationshipType.RECURSIVE,
          name: "childFolder",
        }),
      });

      const parentReference = getReference(
        FolderWithRelationsSchema.shape.parentFolderId
      );
      const childrenReference = getReference(
        FolderWithRelationsSchema.shape.childFolderIds
      );

      expect(parentReference?.type).toBe(RelationshipType.RECURSIVE);
      expect(parentReference?.name).toBe("parentFolder");

      expect(childrenReference?.type).toBe(RelationshipType.RECURSIVE);
      expect(childrenReference?.name).toBe("childFolder");
    });
  });
});
