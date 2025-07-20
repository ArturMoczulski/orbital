import { Test, TestingModule } from "@nestjs/testing";
import {
  BulkCountedResponse,
  BulkItemizedResponse,
} from "@orbital/bulk-operations";
import { Character, Gender } from "@orbital/characters";
import { CharacterService } from "./character.service";
import { CharactersCRUDService } from "./characters.crud.service";

describe("CharacterService", () => {
  let service: CharacterService;
  let crudService: CharactersCRUDService;

  beforeEach(async () => {
    // Create a mock CRUD service
    const mockCRUDService = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Create a test module with the service and mock CRUD service
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        {
          provide: CharactersCRUDService,
          useValue: mockCRUDService,
        },
      ],
    }).compile();

    // Get the service and CRUD service from the test module
    service = module.get<CharacterService>(CharacterService);
    crudService = module.get<CharactersCRUDService>(CharactersCRUDService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findById", () => {
    it("should call crudService.findById with the correct id", async () => {
      // Arrange
      const id = "character-id-1";
      const expectedResult = Character.mock({
        _id: id,
        firstName: "John",
        lastName: "Doe",
        worldId: "world-id-1",
      });

      jest.spyOn(crudService, "findById").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(crudService.findById).toHaveBeenCalledWith(id, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByIds", () => {
    it("should call crudService.findByIds with the correct ids", async () => {
      // Arrange
      const ids = ["character-id-1", "character-id-2"];
      const expectedResult = [
        Character.mock({
          _id: "character-id-1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world-id-1",
        }),
        Character.mock({
          _id: "character-id-2",
          firstName: "Jane",
          lastName: "Doe",
          gender: Gender.Female,
          worldId: "world-id-1",
        }),
      ];

      jest.spyOn(crudService, "findByIds").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByIds(ids);

      // Assert
      expect(crudService.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("create", () => {
    it("should call crudService.create with the correct character", async () => {
      // Arrange
      const character = Character.mock({
        firstName: "John",
        lastName: "Doe",
        worldId: "world-id-1",
      });

      const expectedResult = Character.mock({
        _id: "new-id",
        firstName: "John",
        lastName: "Doe",
        worldId: "world-id-1",
      });

      jest.spyOn(crudService, "create").mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(character);

      // Assert
      expect(crudService.create).toHaveBeenCalledWith(character);
      expect(result).toEqual(expectedResult);
    });

    it("should handle BulkItemizedResponse from crudService.create", async () => {
      // Arrange
      const character = Character.mock({
        firstName: "John",
        lastName: "Doe",
        worldId: "world-id-1",
      });

      const expectedCharacter = Character.mock({
        _id: "new-id",
        firstName: "John",
        lastName: "Doe",
        worldId: "world-id-1",
      });

      const bulkResponse = new BulkItemizedResponse();
      bulkResponse.asSingle = jest.fn().mockReturnValue(expectedCharacter);

      jest.spyOn(crudService, "create").mockResolvedValue(bulkResponse);

      // Act
      const result = await service.create(character);

      // Assert
      expect(crudService.create).toHaveBeenCalledWith(character);
      expect(result).toEqual(bulkResponse);
    });
  });

  describe("update", () => {
    it("should call crudService.update with the correct character", async () => {
      // Arrange
      const id = "character-id-1";
      const character = Character.mock({
        _id: id,
        firstName: "Updated",
        lastName: "Character",
      });

      const expectedResult = Character.mock({
        _id: id,
        firstName: "Updated",
        lastName: "Character",
        worldId: "world-id-1",
      });

      jest.spyOn(crudService, "update").mockResolvedValue(expectedResult);

      // Act
      const result = await service.update(character);

      // Assert
      expect(crudService.update).toHaveBeenCalledWith(character);
      expect(result).toEqual(expectedResult);
    });

    it("should handle BulkItemizedResponse from crudService.update", async () => {
      // Arrange
      const id = "character-id-1";
      const character = Character.mock({
        _id: id,
        firstName: "Updated",
        lastName: "Character",
      });

      const expectedCharacter = Character.mock({
        _id: id,
        firstName: "Updated",
        lastName: "Character",
        worldId: "world-id-1",
      });

      const bulkResponse = new BulkItemizedResponse();
      bulkResponse.asSingle = jest.fn().mockReturnValue(expectedCharacter);

      jest.spyOn(crudService, "update").mockResolvedValue(bulkResponse);

      // Act
      const result = await service.update(character);

      // Assert
      expect(crudService.update).toHaveBeenCalledWith(character);
      expect(result).toEqual(bulkResponse);
    });
  });

  describe("delete", () => {
    it("should call crudService.delete with the correct id", async () => {
      // Arrange
      const id = "character-id-1";
      const expectedResult = true;

      jest.spyOn(crudService, "delete").mockResolvedValue(expectedResult);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(crudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it("should handle BulkCountedResponse from crudService.delete", async () => {
      // Arrange
      const id = "character-id-1";

      const bulkResponse = new BulkCountedResponse();
      bulkResponse.counts = { success: 1, fail: 0 };

      jest.spyOn(crudService, "delete").mockResolvedValue(bulkResponse);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(crudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(bulkResponse);
    });

    it("should handle array of ids", async () => {
      // Arrange
      const ids = ["character-id-1", "character-id-2"];

      const bulkResponse = new BulkCountedResponse();
      bulkResponse.counts = { success: 2, fail: 0 };

      jest.spyOn(crudService, "delete").mockResolvedValue(bulkResponse);

      // Act
      const result = await service.delete(ids);

      // Assert
      expect(crudService.delete).toHaveBeenCalledWith(ids);
      expect(result).toEqual(bulkResponse);
    });
  });

  describe("find", () => {
    it("should call crudService.find with the correct filter", async () => {
      // Arrange
      const filter = { worldId: "world-id-1" };
      const expectedResult = [
        Character.mock({
          _id: "character-id-1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world-id-1",
        }),
        Character.mock({
          _id: "character-id-2",
          firstName: "Jane",
          lastName: "Doe",
          gender: Gender.Female,
          worldId: "world-id-1",
        }),
      ];

      jest.spyOn(crudService, "find").mockResolvedValue(expectedResult);

      // Act
      const result = await service.find(filter);

      // Assert
      expect(crudService.find).toHaveBeenCalledWith(
        filter,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
