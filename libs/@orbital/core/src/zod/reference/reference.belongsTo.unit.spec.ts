import { z } from "zod";
import { getReference, hasReference, RelationshipType } from "./reference";

// Create test schemas
const CategorySchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  })
  .describe("A category with name and description");

const ProductSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    price: z.number(),
    categoryId: z.string(),
  })
  .describe("A product with name and price");

describe("BELONGS_TO Relationship Tests", () => {
  describe("ZodString BELONGS_TO references", () => {
    it("should create a BELONGS_TO relationship with default type", () => {
      // Many products belong to one category (categoryId in Product references Category)
      const schema = z.object({
        categoryId: z.string().reference({
          schema: CategorySchema,
          // No type specified - should default to BELONGS_TO
        }),
      });

      const reference = getReference(schema.shape.categoryId);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(CategorySchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("category");
      expect(reference?.type).toBe(RelationshipType.BELONGS_TO);
    });

    it("should create a BELONGS_TO relationship with explicit type", () => {
      const schema = z.object({
        categoryId: z.string().reference({
          schema: CategorySchema,
          type: RelationshipType.BELONGS_TO,
        }),
      });

      const reference = getReference(schema.shape.categoryId);

      expect(reference).toBeDefined();
      expect(reference?.type).toBe(RelationshipType.BELONGS_TO);
    });

    it("should support custom field and name in BELONGS_TO relationship", () => {
      const schema = z.object({
        categoryName: z.string().reference({
          schema: CategorySchema,
          foreignField: "name",
          name: "productCategory",
          type: RelationshipType.BELONGS_TO,
        }),
      });

      const reference = getReference(schema.shape.categoryName);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(CategorySchema);
      expect(reference?.foreignField).toBe("name");
      expect(reference?.name).toBe("productCategory");
      expect(reference?.type).toBe(RelationshipType.BELONGS_TO);
    });
  });

  describe("Practical BELONGS_TO examples", () => {
    it("should model a Products-Category belongs-to relationship", () => {
      // In a real application, many Products would belong to one Category
      const ProductSchemaWithCategory = z.object({
        _id: z.string(),
        name: z.string(),
        price: z.number(),
        categoryId: z.string().reference({
          schema: CategorySchema,
          type: RelationshipType.BELONGS_TO,
        }),
      });

      const reference = getReference(
        ProductSchemaWithCategory.shape.categoryId
      );

      expect(hasReference(ProductSchemaWithCategory.shape.categoryId)).toBe(
        true
      );
      expect(reference?.type).toBe(RelationshipType.BELONGS_TO);
      expect(reference?.name).toBe("category");
    });

    it("should model a Comments-Post belongs-to relationship", () => {
      // Post schema
      const PostSchema = z
        .object({
          _id: z.string(),
          title: z.string(),
          content: z.string(),
        })
        .describe("A blog post with title and content");

      // Comment schema with reference to post
      const CommentSchema = z.object({
        _id: z.string(),
        text: z.string(),
        postId: z.string().reference({
          schema: PostSchema,
          type: RelationshipType.BELONGS_TO,
        }),
      });

      const reference = getReference(CommentSchema.shape.postId);

      expect(reference?.type).toBe(RelationshipType.BELONGS_TO);
      expect(reference?.name).toBe("blog post");
    });
  });
});
