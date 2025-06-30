import { Test, TestingModule } from "@nestjs/testing";
import { CrudService } from "@orbital/nest";
import { Area } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";

describe("AreasService", () => {
  let service: AreasService;
  let repository: AreasRepository;

  beforeEach(async () => {
    // Create a mock repository
    const mockRepository = {
      findByWorldId: jest.fn(),
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
        AreasService,
        {
          provide: AreasRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get the service and repository from the test module
    service = module.get<AreasService>(AreasService);
    repository = module.get<AreasRepository>(AreasRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should be an instance of CrudService", () => {
    expect(service).toBeInstanceOf(CrudService);
  });

  describe("findByWorldId", () => {
    it("should call repository.findByWorldId with the correct parameters", async () => {
      // Arrange
      const worldId = "world-id-123";
      const projection = { name: 1, description: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult: Area[] = [
        {
          _id: "area-id-1",
          worldId,
          name: "Test Area 1",
          description: "Description 1",
        } as Area,
        {
          _id: "area-id-2",
          worldId,
          name: "Test Area 2",
          description: "Description 2",
        } as Area,
      ];

      // Mock the repository method
      jest.spyOn(repository, "findByWorldId").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByWorldId(worldId, projection, options);

      // Assert
      expect(repository.findByWorldId).toHaveBeenCalledWith(
        worldId,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call repository.findByWorldId with default parameters when not provided", async () => {
      // Arrange
      const worldId = "world-id-123";
      const expectedResult: Area[] = [];

      // Mock the repository method
      jest.spyOn(repository, "findByWorldId").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByWorldId(worldId);

      // Assert
      expect(repository.findByWorldId).toHaveBeenCalledWith(
        worldId,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  // Since AreasService extends CrudService, we don't need to test
  // all the inherited methods as they are tested in crud.service.spec.ts
  // We just need to ensure our custom methods work correctly
});
