import { Test, TestingModule } from "@nestjs/testing";
import { CRUDService } from "@orbital/nest";
import { AreaModel } from "@orbital/typegoose";
import { AreasCRUDService } from "./areas.crud.service";
import { AreasRepository } from "./areas.repository";

describe("AreasCRUDService", () => {
  let service: AreasCRUDService;
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
        AreasCRUDService,
        {
          provide: AreasRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get the service and repository from the test module
    service = module.get<AreasCRUDService>(AreasCRUDService);
    repository = module.get<AreasRepository>(AreasRepository);
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

  describe("findByWorldId", () => {
    it("should call repository.findByWorldId with the correct parameters", async () => {
      // Arrange
      const worldId = "world-id-123";
      const projection = { name: 1, description: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult: AreaModel[] = [
        {
          _id: "area-id-1",
          worldId,
          name: "Test Area 1",
          description: "Description 1",
        } as AreaModel,
        {
          _id: "area-id-2",
          worldId,
          name: "Test Area 2",
          description: "Description 2",
        } as AreaModel,
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
      const expectedResult: AreaModel[] = [];

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

  // Since AreasService extends CRUDService, we don't need to test
  // all the inherited methods as they are tested in crud.service.spec.ts
  // We just need to ensure our custom methods work correctly
});
