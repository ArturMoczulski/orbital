import { Test, TestingModule } from "@nestjs/testing";
import { WorldMicroservice } from "@orbital/world-rpc";
import { CharactersService } from "./characters.service";

describe("CharactersService", () => {
  let service: CharactersService;
  let worldMicroserviceMock: any;

  beforeEach(async () => {
    // Create a mock for the WorldMicroservice
    worldMicroserviceMock = {
      characters: {
        find: jest.fn(),
        findById: jest.fn(),
        findByLocationId: jest.fn(),
        findByWorldId: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        {
          provide: WorldMicroservice,
          useValue: worldMicroserviceMock,
        },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("find", () => {
    it("should call worldMicroservice.characters.find with correct parameters", async () => {
      const filter = { name: "Test" };
      worldMicroserviceMock.characters.find.mockResolvedValue([]);

      await service.find(filter);

      expect(worldMicroserviceMock.characters.find).toHaveBeenCalledWith({
        filter,
        projection: {},
        options: {},
      });
    });

    it("should return an empty array if result is not an array", async () => {
      worldMicroserviceMock.characters.find.mockResolvedValue(null);

      const result = await service.find();

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should call worldMicroservice.characters.findById with correct parameters", async () => {
      const id = "test-id";
      worldMicroserviceMock.characters.findById.mockResolvedValue({
        _id: id,
        name: "Test Character",
      });

      await service.findById(id);

      expect(worldMicroserviceMock.characters.findById).toHaveBeenCalledWith({
        id,
        projection: {},
      });
    });

    it("should throw an error if character is not found", async () => {
      worldMicroserviceMock.characters.findById.mockResolvedValue(null);

      await expect(service.findById("non-existent-id")).rejects.toThrow(
        "Character not found"
      );
    });
  });

  describe("findByLocationId", () => {
    it("should call worldMicroservice.characters.findByLocationId with correct parameters", async () => {
      const locationId = "location-id";
      worldMicroserviceMock.characters.findByLocationId.mockResolvedValue([]);

      await service.findByLocationId(locationId);

      expect(
        worldMicroserviceMock.characters.findByLocationId
      ).toHaveBeenCalledWith({
        locationId,
        projection: {},
        options: {},
      });
    });
  });

  describe("findByWorldId", () => {
    it("should call worldMicroservice.characters.findByWorldId with correct parameters", async () => {
      const worldId = "world-id";
      worldMicroserviceMock.characters.findByWorldId.mockResolvedValue([]);

      await service.findByWorldId(worldId);

      expect(
        worldMicroserviceMock.characters.findByWorldId
      ).toHaveBeenCalledWith({
        worldId,
        projection: {},
        options: {},
      });
    });
  });

  describe("create", () => {
    it("should call worldMicroservice.characters.create with correct parameters", async () => {
      const characterData = {
        firstName: "John",
        lastName: "Doe",
      };
      worldMicroserviceMock.characters.create.mockResolvedValue({
        _id: "new-id",
        ...characterData,
      });

      await service.create(characterData);

      expect(worldMicroserviceMock.characters.create).toHaveBeenCalledWith(
        characterData
      );
    });
  });

  describe("update", () => {
    it("should call worldMicroservice.characters.update with correct parameters", async () => {
      const id = "test-id";
      const updateData = {
        firstName: "Updated",
      };
      worldMicroserviceMock.characters.update.mockResolvedValue({
        _id: id,
        firstName: "Updated",
        lastName: "Doe",
      });

      await service.update(id, updateData);

      expect(worldMicroserviceMock.characters.update).toHaveBeenCalledWith({
        _id: id,
        ...updateData,
      });
    });
  });

  describe("delete", () => {
    it("should call worldMicroservice.characters.delete with correct parameters", async () => {
      const id = "test-id";
      worldMicroserviceMock.characters.delete.mockResolvedValue(true);

      await service.delete(id);

      expect(worldMicroserviceMock.characters.delete).toHaveBeenCalledWith(id);
    });
  });
});
