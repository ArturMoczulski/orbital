import { Test, TestingModule } from "@nestjs/testing";
import { CRUDService } from "@orbital/nest";
import { WorldModel } from "@orbital/typegoose";
import { WorldsCRUDService } from "./worlds.crud.service";
import { WorldsRepository } from "./worlds.repository";

describe("WorldsCRUDService", () => {
  let service: WorldsCRUDService;
  let repository: WorldsRepository;

  beforeEach(async () => {
    // Create a mock repository
    const mockRepository = {
      findByShard: jest.fn(),
      findByTechLevel: jest.fn(),
      // Add other repository methods that might be used
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Create a test module with the service and mock repository
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorldsCRUDService,
        {
          provide: WorldsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get the service and repository from the test module
    service = module.get<WorldsCRUDService>(WorldsCRUDService);
    repository = module.get<WorldsRepository>(WorldsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should be an instance of CRUDService", () => {
    expect(service).toBeInstanceOf(CRUDService);
  });

  describe("findByShard", () => {
    it("should call repository.findByShard with the correct parameters", async () => {
      // Arrange
      const shard = "test-shard";
      const projection = { name: 1, techLevel: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult: WorldModel[] = [
        {
          _id: "world-id-1",
          shard,
          name: "Test World 1",
          techLevel: 3,
        } as WorldModel,
        {
          _id: "world-id-2",
          shard,
          name: "Test World 2",
          techLevel: 5,
        } as WorldModel,
      ];

      // Mock the repository method
      jest.spyOn(repository, "findByShard").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByShard(shard, projection, options);

      // Assert
      expect(repository.findByShard).toHaveBeenCalledWith(
        shard,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call repository.findByShard with default parameters when not provided", async () => {
      // Arrange
      const shard = "test-shard";
      const expectedResult: WorldModel[] = [];

      // Mock the repository method
      jest.spyOn(repository, "findByShard").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByShard(shard);

      // Assert
      expect(repository.findByShard).toHaveBeenCalledWith(
        shard,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByTechLevel", () => {
    it("should call repository.findByTechLevel with the correct parameters", async () => {
      // Arrange
      const techLevel = 5;
      const projection = { name: 1, shard: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult: WorldModel[] = [
        {
          _id: "world-id-1",
          shard: "shard-1",
          name: "Test World 1",
          techLevel,
        } as WorldModel,
        {
          _id: "world-id-2",
          shard: "shard-2",
          name: "Test World 2",
          techLevel,
        } as WorldModel,
      ];

      // Mock the repository method
      jest
        .spyOn(repository, "findByTechLevel")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByTechLevel(
        techLevel,
        projection,
        options
      );

      // Assert
      expect(repository.findByTechLevel).toHaveBeenCalledWith(
        techLevel,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call repository.findByTechLevel with default parameters when not provided", async () => {
      // Arrange
      const techLevel = 5;
      const expectedResult: WorldModel[] = [];

      // Mock the repository method
      jest
        .spyOn(repository, "findByTechLevel")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByTechLevel(techLevel);

      // Assert
      expect(repository.findByTechLevel).toHaveBeenCalledWith(
        techLevel,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  // Since WorldsCRUDService extends CRUDService, we don't need to test
  // all the inherited methods as they are tested in crud.service.spec.ts
  // We just need to ensure our custom methods work correctly
});
