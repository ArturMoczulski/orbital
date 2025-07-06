import { z } from "zod";
import { getReference, hasReference, RelationshipType } from "./reference";

// Create test schemas
const StudentSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    grade: z.number(),
  })
  .describe("A student with name and grade");

const CourseSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    credits: z.number(),
  })
  .describe("A course with title and credits");

describe("MANY_TO_MANY Relationship Tests", () => {
  describe("ZodArray MANY_TO_MANY references", () => {
    it("should create a HAS_MANY relationship with default type", () => {
      // Students can enroll in many courses, and courses can have many students
      const schema = z.object({
        courseIds: z.array(z.string()).reference({
          schema: CourseSchema,
          // No type specified - should default to HAS_MANY for arrays
        }),
      });

      const reference = getReference(schema.shape.courseIds);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(CourseSchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("course");
      expect(reference?.type).toBe(RelationshipType.HAS_MANY);
    });

    it("should create a MANY_TO_MANY relationship with explicit type", () => {
      const schema = z.object({
        courseIds: z.array(z.string()).reference({
          schema: CourseSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      });

      const reference = getReference(schema.shape.courseIds);

      expect(reference).toBeDefined();
      expect(reference?.type).toBe(RelationshipType.MANY_TO_MANY);
    });

    it("should support custom field and name in MANY_TO_MANY relationship", () => {
      const schema = z.object({
        enrolledCourses: z.array(z.string()).reference({
          schema: CourseSchema,
          foreignField: "title",
          name: "enrollment",
          type: RelationshipType.MANY_TO_MANY,
        }),
      });

      const reference = getReference(schema.shape.enrolledCourses);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(CourseSchema);
      expect(reference?.foreignField).toBe("title");
      expect(reference?.name).toBe("enrollment");
      expect(reference?.type).toBe(RelationshipType.MANY_TO_MANY);
    });
  });

  describe("Practical MANY_TO_MANY examples", () => {
    it("should model a Students-Courses many-to-many relationship", () => {
      // Student with courses
      const StudentWithCoursesSchema = z.object({
        _id: z.string(),
        name: z.string(),
        grade: z.number(),
        courseIds: z.array(z.string()).reference({
          schema: CourseSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      });

      // Course with students
      const CourseWithStudentsSchema = z.object({
        _id: z.string(),
        title: z.string(),
        credits: z.number(),
        studentIds: z.array(z.string()).reference({
          schema: StudentSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      });

      const studentCoursesReference = getReference(
        StudentWithCoursesSchema.shape.courseIds
      );
      const courseStudentsReference = getReference(
        CourseWithStudentsSchema.shape.studentIds
      );

      expect(hasReference(StudentWithCoursesSchema.shape.courseIds)).toBe(true);
      expect(studentCoursesReference?.type).toBe(RelationshipType.MANY_TO_MANY);
      expect(studentCoursesReference?.name).toBe("course");

      expect(hasReference(CourseWithStudentsSchema.shape.studentIds)).toBe(
        true
      );
      expect(courseStudentsReference?.type).toBe(RelationshipType.MANY_TO_MANY);
      expect(courseStudentsReference?.name).toBe("student");
    });

    it("should model a Tags-Articles many-to-many relationship", () => {
      // Tag schema
      const TagSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
        })
        .describe("A tag for categorizing content");

      // Article schema
      const ArticleSchema = z
        .object({
          _id: z.string(),
          title: z.string(),
          content: z.string(),
        })
        .describe("An article with title and content");

      // Article with tags
      const ArticleWithTagsSchema = z.object({
        _id: z.string(),
        title: z.string(),
        content: z.string(),
        tagIds: z.array(z.string()).reference({
          schema: TagSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      });

      // Tag with articles
      const TagWithArticlesSchema = z.object({
        _id: z.string(),
        name: z.string(),
        articleIds: z.array(z.string()).reference({
          schema: ArticleSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      });

      const articleTagsReference = getReference(
        ArticleWithTagsSchema.shape.tagIds
      );
      const tagArticlesReference = getReference(
        TagWithArticlesSchema.shape.articleIds
      );

      expect(articleTagsReference?.type).toBe(RelationshipType.MANY_TO_MANY);
      expect(tagArticlesReference?.type).toBe(RelationshipType.MANY_TO_MANY);
    });
  });
});
