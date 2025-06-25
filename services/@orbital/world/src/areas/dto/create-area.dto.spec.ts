import { validate } from "class-validator";
import { CreateAreaDto } from "./create-area.dto";
import { Position } from "@orbital/core";

describe("CreateAreaDto", () => {
  it("should validate a valid DTO", async () => {
    const dto = new CreateAreaDto();
    dto.name = "Test Area";
    dto.description = "Test Description";
    dto.position = new Position({ x: 0, y: 0, z: 0 });
    dto.worldId = "world1";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail validation when required properties are missing", async () => {
    const dto = new CreateAreaDto();
    // Missing all required properties

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    // Check for specific validation errors
    const errorProperties = errors.map((error) => error.property);
    expect(errorProperties).toContain("name");
    // description is now optional
    expect(errorProperties).toContain("position");
    expect(errorProperties).toContain("worldId");
  });

  it("should validate with optional properties", async () => {
    const dto = new CreateAreaDto();
    dto.name = "Test Area";
    // description is now optional, so we can test without it
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
    const dto = new CreateAreaDto();
    dto.name = "Test Area";
    dto.description = "Test Description";
    dto.position = "not a position object" as any;
    dto.worldId = "world1";
    dto.tags = "not an array" as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    // Check for specific validation errors
    const errorProperties = errors.map((error) => error.property);
    expect(errorProperties).toContain("position");
    expect(errorProperties).toContain("tags");
  });
});
