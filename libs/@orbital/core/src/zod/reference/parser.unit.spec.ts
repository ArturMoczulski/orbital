import { z } from "zod";
import { parseWithReferences } from "./parser";
import { RelationshipType } from "./reference";

// Create test schemas
const WorldSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    active: z.boolean().default(true),
  })
  .describe("A world with name");

const AreaSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    worldId: z.string().reference({
      schema: WorldSchema,
    }),
  })
  .describe("An area with name");

const CharacterSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    areaIds: z.array(z.string()).reference({
      schema: AreaSchema,
      type: RelationshipType.MANY_TO_MANY,
    }),
  })
  .describe("A character with name");

describe("parseWithReferences", () => {
  describe("basic validation", () => {
    it("should pass standard Zod validation", () => {
      const result = parseWithReferences(AreaSchema, {
        _id: "area1",
        name: "Test Area",
        worldId: "world1",
      });

      expect(result.success).toBe(true);
    });

    it("should fail standard Zod validation for invalid data", () => {
      const result = parseWithReferences(AreaSchema, {
        _id: "area1",
        // Missing name field
        worldId: "world1",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("name");
    });
  });

  describe("reference validation", () => {
    const testWorlds = [
      { _id: "world1", name: "Test World", active: true },
      { _id: "world2", name: "Another World", active: false },
    ];

    const testAreas = [
      { _id: "area1", name: "Test Area", worldId: "world1" },
      { _id: "area2", name: "Another Area", worldId: "world2" },
    ];

    it("should pass validation when reference exists", () => {
      const result = parseWithReferences(
        AreaSchema,
        {
          _id: "area3",
          name: "New Area",
          worldId: "world1",
        },
        {
          dependencies: {
            world: testWorlds,
          },
        }
      );

      expect(result.success).toBe(true);
    });

    it("should fail validation when reference doesn't exist", () => {
      const result = parseWithReferences(
        AreaSchema,
        {
          _id: "area3",
          name: "New Area",
          worldId: "nonexistent",
        },
        {
          dependencies: {
            world: testWorlds,
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(["worldId"]);
      expect(result.error?.issues[0].message).toContain("Referenced world");
    });

    it("should validate array references", () => {
      // Valid case - all areas exist
      const validResult = parseWithReferences(
        CharacterSchema,
        {
          _id: "char1",
          name: "Test Character",
          areaIds: ["area1", "area2"],
        },
        {
          dependencies: {
            area: testAreas,
          },
          maxDepth: 3, // Explicitly set higher maxDepth for array references
        }
      );

      expect(validResult.success).toBe(true);

      // Invalid case - one area doesn't exist
      const invalidResult = parseWithReferences(
        CharacterSchema,
        {
          _id: "char1",
          name: "Test Character",
          areaIds: ["area1", "nonexistent"],
        },
        {
          dependencies: {
            area: testAreas,
          },
          maxDepth: 3, // Explicitly set higher maxDepth for array references
        }
      );

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error?.issues[0].path).toEqual(["areaIds", 1]);
      expect(invalidResult.error?.issues[0].message).toContain(
        "Referenced area"
      );
    });
  });

  describe("nested objects", () => {
    const GameSchema = z.object({
      _id: z.string(),
      title: z.string(),
      world: AreaSchema,
      characters: z.array(CharacterSchema),
    });

    const testWorlds = [{ _id: "world1", name: "Test World", active: true }];

    const testAreas = [
      { _id: "area1", name: "Test Area", worldId: "world1" },
      { _id: "area2", name: "Another Area", worldId: "world1" },
    ];

    it("should validate references in nested objects", () => {
      const result = parseWithReferences(
        GameSchema,
        {
          _id: "game1",
          title: "Test Game",
          world: {
            _id: "area3",
            name: "Game Area",
            worldId: "world1",
          },
          characters: [
            {
              _id: "char1",
              name: "Character 1",
              areaIds: ["area1"],
            },
            {
              _id: "char2",
              name: "Character 2",
              areaIds: ["area1", "area2"],
            },
          ],
        },
        {
          dependencies: {
            world: testWorlds,
            area: testAreas,
          },
          maxDepth: 5, // Explicitly set higher maxDepth for nested objects
        }
      );

      expect(result.success).toBe(true);
    });

    it("should fail validation for invalid references in nested objects", () => {
      const result = parseWithReferences(
        GameSchema,
        {
          _id: "game1",
          title: "Test Game",
          world: {
            _id: "area3",
            name: "Game Area",
            worldId: "nonexistent", // Invalid world reference
          },
          characters: [
            {
              _id: "char1",
              name: "Character 1",
              areaIds: ["area1"],
            },
            {
              _id: "char2",
              name: "Character 2",
              areaIds: ["area1", "nonexistent"], // Invalid area reference
            },
          ],
        },
        {
          dependencies: {
            world: testWorlds,
            area: testAreas,
          },
          maxDepth: 5, // Explicitly set higher maxDepth for nested objects
        }
      );

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(2);
      expect(result.error?.issues[0].path).toEqual(["world", "worldId"]);
      expect(result.error?.issues[1].path).toEqual([
        "characters",
        1,
        "areaIds",
        1,
      ]);
    });
  });

  describe("ZodType extension", () => {
    it("should add parseWithReferences method to ZodType", () => {
      // This test requires the extensions to be loaded
      // Import the extensions
      require("./extensions");

      // Now AreaSchema should have parseWithReferences method
      expect(typeof AreaSchema.parseWithReferences).toBe("function");

      const testWorlds = [{ _id: "world1", name: "Test World", active: true }];

      const result = AreaSchema.parseWithReferences(
        {
          _id: "area1",
          name: "Test Area",
          worldId: "world1",
        },
        {
          dependencies: {
            world: testWorlds,
          },
        }
      );

      expect(result.success).toBe(true);
    });
  });
});
