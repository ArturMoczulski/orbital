import { Test, TestingModule } from "@nestjs/testing";
import { Character, CreatureType, Gender, Race } from "@orbital/characters";
import { WithId, WithoutId } from "@orbital/core";
import { CharactersCRUDService } from "./characters.crud.service";
import { CharactersMicroserviceController } from "./characters.microservice.controller";

describe("CharactersMicroserviceController", () => {
  let controller: CharactersMicroserviceController;
  let service: CharactersCRUDService;

  // Mock service methods
  const mockService = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByLocationId: jest.fn(),
    findByWorldId: jest.fn(),
  };

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharactersMicroserviceController],
      providers: [
        {
          provide: CharactersCRUDService,
          useValue: mockService,
        },
      ],
    }).compile();

    // Get controller and service instances
    controller = module.get<CharactersMicroserviceController>(
      CharactersMicroserviceController
    );
    service = module.get<CharactersCRUDService>(CharactersCRUDService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with correct parameters", async () => {
      // Arrange
      // Create a mock character that satisfies the Character interface
      const character = {
        _id: "test-character-id",
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        attributes: {
          ST: 10,
          DX: 12,
          IQ: 14,
          HT: 10,
        },
        psychologicalProfile: {
          normAdherence: 5,
          altruism: 7,
          selfCenteredness: 3,
          ambition: 6,
          happiness: 8,
          selfDrive: 7,
          authorityNeed: 4,
          authorityObedience: 6,
          entrepreneurialTendency: 5,
          sociability: 8,
        },
        creatureType: CreatureType.Humanoid,
        worldId: "test-world",
        // Add required methods from Character interface
        createdAt: new Date(),
        updatedAt: new Date(),
        toPlainObject: jest.fn(),
        convertValueToPlain: jest.fn(),
        validateSchema: jest.fn(),
      };
      const expectedResult = { _id: "1", ...character } as unknown as Character;
      mockService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(
        character as unknown as WithoutId<Character>
      );

      // Assert
      expect(mockService.create).toHaveBeenCalledWith(character);
      expect(result).toBe(expectedResult);
    });
  });

  describe("find", () => {
    it("should call service.find with correct parameters", async () => {
      // Arrange
      const payload = {
        filter: { worldId: "test-world" },
        projection: { firstName: 1, lastName: 1 },
        options: { sort: { firstName: 1 } },
      };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe" },
        { _id: "2", firstName: "Jane", lastName: "Smith" },
      ] as unknown as Character[];
      mockService.find.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.find(payload);

      // Assert
      expect(mockService.find).toHaveBeenCalledWith(
        payload.filter,
        payload.projection,
        payload.options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call service.findById with correct parameters", async () => {
      // Arrange
      const payload = {
        id: "test-id",
        projection: { firstName: 1, lastName: 1 },
      };
      const expectedResult = {
        _id: "test-id",
        firstName: "John",
        lastName: "Doe",
      } as unknown as Character;
      mockService.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findById(payload);

      // Assert
      expect(mockService.findById).toHaveBeenCalledWith(
        payload.id,
        payload.projection
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with correct parameters", async () => {
      // Arrange
      // Create a mock character that satisfies the Character interface with _id
      const character = {
        _id: "1",
        firstName: "John",
        lastName: "Doe",
        gender: Gender.Male,
        race: Race.Human,
        attributes: {
          ST: 10,
          DX: 12,
          IQ: 14,
          HT: 10,
        },
        psychologicalProfile: {
          normAdherence: 5,
          altruism: 7,
          selfCenteredness: 3,
          ambition: 6,
          happiness: 8,
          selfDrive: 7,
          authorityNeed: 4,
          authorityObedience: 6,
          entrepreneurialTendency: 5,
          sociability: 8,
        },
        creatureType: CreatureType.Humanoid,
        worldId: "test-world",
        // Add required methods from Character interface
        createdAt: new Date(),
        updatedAt: new Date(),
        toPlainObject: jest.fn(),
        convertValueToPlain: jest.fn(),
        validateSchema: jest.fn(),
      };
      const expectedResult = { ...character } as unknown as Character;
      mockService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(
        character as unknown as WithId<Character>
      );

      // Assert
      expect(mockService.update).toHaveBeenCalledWith(character);
      expect(result).toBe(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call service.delete with correct parameters", async () => {
      // Arrange
      const id = "test-id";
      const expectedResult = true;
      mockService.delete.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.delete(id);

      // Assert
      expect(mockService.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });

  describe("findByLocationId", () => {
    it("should call service.findByLocationId with correct parameters", async () => {
      // Arrange
      const payload = {
        locationId: "test-location",
        projection: { firstName: 1, lastName: 1 },
        options: { sort: { firstName: 1 } },
      };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe" },
        { _id: "2", firstName: "Jane", lastName: "Smith" },
      ] as unknown as Character[];
      mockService.findByLocationId.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByLocationId(payload);

      // Assert
      expect(mockService.findByLocationId).toHaveBeenCalledWith(
        payload.locationId,
        payload.projection,
        payload.options
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("findByWorldId", () => {
    it("should call service.findByWorldId with correct parameters", async () => {
      // Arrange
      const payload = {
        worldId: "test-world",
        projection: { firstName: 1, lastName: 1 },
        options: { sort: { firstName: 1 } },
      };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe" },
        { _id: "2", firstName: "Jane", lastName: "Smith" },
      ] as unknown as Character[];
      mockService.findByWorldId.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByWorldId(payload);

      // Assert
      expect(mockService.findByWorldId).toHaveBeenCalledWith(
        payload.worldId,
        payload.projection,
        payload.options
      );
      expect(result).toBe(expectedResult);
    });
  });
});
