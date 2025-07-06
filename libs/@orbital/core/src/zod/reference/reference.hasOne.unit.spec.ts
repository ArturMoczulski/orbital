import { z } from "zod";
import { getReference, hasReference, RelationshipType } from "./reference";

// Create test schemas
const UserSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    email: z.string().email(),
  })
  .describe("A user with name and email");

const ProfileSchema = z
  .object({
    _id: z.string(),
    userId: z.string(),
    bio: z.string(),
    avatarUrl: z.string().optional(),
  })
  .describe("A profile with user details");

describe("HAS_ONE Relationship Tests", () => {
  describe("ZodString HAS_ONE references", () => {
    it("should create a HAS_ONE relationship with explicit type", () => {
      // User has one profile (userId in Profile references User)
      const schema = z.object({
        userId: z.string().reference({
          schema: UserSchema,
          type: RelationshipType.HAS_ONE,
        }),
      });

      const reference = getReference(schema.shape.userId);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(UserSchema);
      expect(reference?.foreignField).toBe("_id");
      expect(reference?.name).toBe("user");
      expect(reference?.type).toBe(RelationshipType.HAS_ONE);
    });

    it("should support custom field and name in HAS_ONE relationship", () => {
      const schema = z.object({
        userEmail: z.string().reference({
          schema: UserSchema,
          foreignField: "email",
          name: "userAccount",
          type: RelationshipType.HAS_ONE,
        }),
      });

      const reference = getReference(schema.shape.userEmail);

      expect(reference).toBeDefined();
      expect(reference?.schema).toBe(UserSchema);
      expect(reference?.foreignField).toBe("email");
      expect(reference?.name).toBe("userAccount");
      expect(reference?.type).toBe(RelationshipType.HAS_ONE);
    });
  });

  describe("Practical HAS_ONE examples", () => {
    it("should model a User-Profile has-one relationship", () => {
      // In a real application, Profile would have a userId field
      // that references the User's _id in a HAS_ONE relationship
      const ProfileSchemaWithReference = z.object({
        _id: z.string(),
        userId: z.string().reference({
          schema: UserSchema,
          type: RelationshipType.HAS_ONE,
        }),
        bio: z.string(),
        avatarUrl: z.string().optional(),
      });

      const reference = getReference(ProfileSchemaWithReference.shape.userId);

      expect(hasReference(ProfileSchemaWithReference.shape.userId)).toBe(true);
      expect(reference?.type).toBe(RelationshipType.HAS_ONE);
      expect(reference?.name).toBe("user");
    });

    it("should model a bidirectional HAS_ONE relationship", () => {
      // User references Profile
      const UserWithProfileSchema = z.object({
        _id: z.string(),
        name: z.string(),
        email: z.string().email(),
        profileId: z.string().reference({
          schema: ProfileSchema,
          type: RelationshipType.HAS_ONE,
        }),
      });

      // Profile references User
      const ProfileWithUserSchema = z.object({
        _id: z.string(),
        userId: z.string().reference({
          schema: UserSchema,
          type: RelationshipType.HAS_ONE,
        }),
        bio: z.string(),
      });

      const userProfileReference = getReference(
        UserWithProfileSchema.shape.profileId
      );
      const profileUserReference = getReference(
        ProfileWithUserSchema.shape.userId
      );

      expect(userProfileReference?.type).toBe(RelationshipType.HAS_ONE);
      expect(profileUserReference?.type).toBe(RelationshipType.HAS_ONE);
    });
  });
});
