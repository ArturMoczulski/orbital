import { validate } from "class-validator";
import { UpdateAreaDto } from "./update-area.dto";
import { Position } from "@orbital/core";

describe("UpdateAreaDto", () => {
  it("should validate an empty DTO (all fields optional)", async () => {
    const dto = new UpdateAreaDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should validate with some properties", async () => {
    const dto = new UpdateAreaDto();
    dto.name = "Updated Area";
    dto.description = "Updated Description";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should validate with all properties", async () => {
    const dto = new UpdateAreaDto();
    dto.name = "Updated Area";
    dto.description = "Updated Description";
    dto.position = new Position({ x: 0, y: 0, z: 0 });
    dto.worldId = "world1";
    dto.parentId = "parent1";
    dto.landmarks = ["landmark1", "landmark2"];
    dto.connections = ["connection1", "connection2"];
    dto.tags = ["tag1", "tag2"];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail validation when properties have incorrect types", async () => {
    const dto = new UpdateAreaDto();
    dto.position = "not a position object" as any;
    dto.tags = "not an array" as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    // Check for specific validation errors
    const errorProperties = errors.map((error) => error.property);
    expect(errorProperties).toContain("position");
    expect(errorProperties).toContain("tags");
  });

  it("should validate with null parentId", async () => {
    const dto = new UpdateAreaDto();
    dto.parentId = null;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
