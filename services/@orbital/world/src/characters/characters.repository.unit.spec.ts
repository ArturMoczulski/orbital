import { Test, TestingModule } from "@nestjs/testing";
import { CreatureType, Gender, Race } from "@orbital/characters";
import { CharacterModel } from "@orbital/typegoose";
import { getModelToken } from "nestjs-typegoose";
import { CharactersRepository } from "./characters.repository";

describe("CharactersRepository", () => {
  let repository: CharactersRepository;
  let characterModel: any;

  // Mock model methods
  const mockModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersRepository,
        {
          provide: getModelToken(CharacterModel.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    // Get repository instance
    repository = module.get<CharactersRepository>(CharactersRepository);
    characterModel = module.get(getModelToken(CharacterModel.name));

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    mockModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    mockModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findByLocationId", () => {
    it("should call model.find with correct parameters", async () => {
      // Arrange
      const locationId = "test-location";
      const projection = { firstName: 1 };
      const options = { sort: { firstName: 1 } };
      const expectedResult = [
        {
          _id: "1",
          firstName: "John",
          lastName: "Doe",
          currentLocation: locationId,
        },
      ];

      // Mock the find method to return our expected result
      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          setOptions: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(expectedResult),
          }),
        }),
      });

      // Act
      const result = await repository.findByLocationId(
        locationId,
        projection,
        options
      );

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith({
        currentLocation: locationId,
      });
      expect(result).toEqual(expect.any(Array));
    });

    it("should return empty array when no characters found", async () => {
      // Arrange
      const locationId = "nonexistent-location";

      // Mock the find method to return empty array
      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          setOptions: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      const result = await repository.findByLocationId(locationId);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith({
        currentLocation: locationId,
      });
      expect(result).toEqual([]);
    });
  });

  // Test inherited methods from DocumentRepository
  describe("find", () => {
    it("should call model.find with correct parameters", async () => {
      // Arrange
      const filter = { worldId: "test-world" };
      const projection = { firstName: 1 };
      const options = { sort: { firstName: 1 } };
      const expectedResult = [
        { _id: "1", firstName: "John", lastName: "Doe", worldId: "test-world" },
      ];

      // Mock the find method to return our expected result
      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          setOptions: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(expectedResult),
          }),
        }),
      });

      // Act
      const result = await repository.find(filter, projection, options);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith(filter);
      expect(result).toEqual(expect.any(Array));
    });
  });

  describe("findById", () => {
    it("should call model.findById with correct parameters", async () => {
      // Arrange
      const id = "test-id";
      const projection = { firstName: 1 };
      const expectedResult = {
        _id: id,
        firstName: "John",
        lastName: "Doe",
        worldId: "test-world",
      };

      // Mock the findById method to return our expected result
      mockModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(expectedResult),
        }),
      });

      // Act
      const result = await repository.findById(id, projection);

      // Assert
      expect(mockModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expect.objectContaining({ _id: id }));
    });
  });

  describe("create", () => {
    it("should call model.create with correct parameters", async () => {
      // Arrange
      const character = {
        _id: "new-character",
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
      };
      const expectedResult = { ...character };
      mockModel.create.mockResolvedValue(expectedResult);

      // Act
      const result = await repository.create(character);

      // Assert
      expect(mockModel.create).toHaveBeenCalledWith(character);
      expect(result).toEqual(expect.objectContaining({ _id: character._id }));
    });
  });

  describe("update", () => {
    it("should call model.findByIdAndUpdate with correct parameters", async () => {
      // Arrange
      const character = {
        _id: "existing-character",
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
      };
      const expectedResult = { ...character };

      // Mock the findByIdAndUpdate method to return our expected result
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expectedResult),
      });

      // Act
      const result = await repository.update(character);

      // Assert
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        character._id,
        expect.any(Object),
        expect.any(Object)
      );
      expect(result).toEqual(expect.objectContaining({ _id: character._id }));
    });
  });

  describe("delete", () => {
    it("should call model.findByIdAndDelete with correct parameters", async () => {
      // Arrange
      const id = "character-to-delete";
      const expectedResult = {
        _id: id,
        firstName: "John",
        lastName: "Doe",
      };

      // Mock the findByIdAndDelete method to return our expected result
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expectedResult),
      });

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it("should return null when character not found", async () => {
      // Arrange
      const id = "nonexistent-character";

      // Mock the findByIdAndDelete method to return null
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });
});
