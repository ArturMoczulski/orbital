import { Test, TestingModule } from "@nestjs/testing";
import { BulkItemizedResponse } from "@orbital/bulk-operations";
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
      // Note: findOne is not exposed by CRUDService, but is used internally by findById
      findOne: jest.fn(),
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

  // Even though AreasService extends CRUDService and these methods are tested in crud.service.spec.ts,
  // we should still test them here to ensure they work correctly with our specific entity

  describe("create", () => {
    it("should call repository.create with the correct parameters", async () => {
      // Arrange
      const areaData = {
        worldId: "world-id-123",
        name: "New Test Area",
        description: "A new test area",
        landmarks: ["landmark1"],
        connections: ["connection1"],
        tags: ["test", "new"],
      };
      const expectedResult = {
        _id: "new-area-id",
        ...areaData,
      };

      // Mock the repository method
      jest
        .spyOn(repository, "create")
        .mockResolvedValue(expectedResult as unknown as AreaModel);

      // Act
      const result = await service.create(areaData);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(areaData);
      expect(result).toEqual(expectedResult);
    });

    it("should throw error when trying to create an area with a non-existent world ID", async () => {
      // Arrange
      const areaData = {
        worldId: "non-existent-world-id",
        name: "Area with Invalid World",
        description: "This area references a world that doesn't exist",
        landmarks: [],
        connections: [],
        tags: ["test"],
      };

      // Mock the repository method to throw an error
      jest
        .spyOn(repository, "create")
        .mockRejectedValue(
          new Error(
            'Referenced entity not found: worlds._id with value "non-existent-world-id"'
          )
        );

      // Act & Assert
      await expect(service.create(areaData)).rejects.toThrow(
        'Referenced entity not found: worlds._id with value "non-existent-world-id"'
      );
    });

    it("should handle creating multiple areas", async () => {
      // Arrange
      const areasData = [
        {
          worldId: "world-id-123",
          name: "Area 1",
          description: "First test area",
          landmarks: [],
          connections: [],
          tags: ["test"],
        },
        {
          worldId: "world-id-123",
          name: "Area 2",
          description: "Second test area",
          landmarks: [],
          connections: [],
          tags: ["test"],
        },
      ];
      const expectedResult = areasData.map((area, index) => ({
        _id: `area-id-${index}`,
        ...area,
      }));

      // Mock the repository method
      jest
        .spyOn(repository, "create")
        .mockResolvedValue(
          expectedResult as unknown as BulkItemizedResponse<
            any,
            AreaModel,
            never
          >
        );

      // Act
      const result = await service.create(areasData);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(areasData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("find", () => {
    it("should call repository.find with the correct parameters", async () => {
      // Arrange
      const filter = { worldId: "world-id-123" };
      const projection = { name: 1, description: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult = [
        {
          _id: "area-id-1",
          worldId: "world-id-123",
          name: "Test Area 1",
          description: "Description 1",
        },
        {
          _id: "area-id-2",
          worldId: "world-id-123",
          name: "Test Area 2",
          description: "Description 2",
        },
      ];

      // Mock the repository method
      jest
        .spyOn(repository, "find")
        .mockResolvedValue(expectedResult as unknown as AreaModel[]);

      // Act
      const result = await service.find(filter, projection, options);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(filter, projection, options);
      expect(result).toEqual(expectedResult);
    });

    it("should call repository.find with default parameters when not provided", async () => {
      // Arrange
      const filter = { worldId: "world-id-123" };
      const expectedResult: AreaModel[] = [];

      // Mock the repository method
      jest.spyOn(repository, "find").mockResolvedValue(expectedResult);

      // Act
      const result = await service.find(filter);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        filter,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  // Note: findOne is not implemented in CRUDService, so we don't test it here
  // The findById method uses findOne internally in the repository layer

  describe("findById", () => {
    it("should call repository.findById with the correct parameters", async () => {
      // Arrange
      const id = "area-id-123";
      const projection = { name: 1, description: 1 };
      const options = { sort: { name: 1 } };
      const expectedResult = {
        _id: id,
        worldId: "world-id-123",
        name: "Test Area",
        description: "Test description",
      };

      // Mock the repository method
      jest
        .spyOn(repository, "findById")
        .mockResolvedValue(expectedResult as unknown as AreaModel);

      // Act
      const result = await service.findById(id, projection);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(id, projection);
      expect(result).toEqual(expectedResult);
    });

    it("should return null when area with ID is not found", async () => {
      // Arrange
      const id = "non-existent-id";

      // Mock the repository method
      jest.spyOn(repository, "findById").mockResolvedValue(null);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(id, undefined);
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should call repository.update with the correct parameters", async () => {
      // Arrange
      const areaData = {
        _id: "area-id-123",
        worldId: "world-id-123",
        name: "Updated Area Name",
        description: "Updated description",
        landmarks: ["landmark1", "landmark2"],
        connections: ["connection1"],
        tags: ["test", "updated"],
      };
      const expectedResult = { ...areaData };

      // Mock the repository method
      jest
        .spyOn(repository, "update")
        .mockResolvedValue(expectedResult as unknown as AreaModel);

      // Act
      const result = await service.update(areaData);

      // Assert
      expect(repository.update).toHaveBeenCalledWith(areaData);
      expect(result).toEqual(expectedResult);
    });

    it("should throw error when trying to update an area with a non-existent world ID", async () => {
      // Arrange
      const areaData = {
        _id: "area-id-123",
        worldId: "non-existent-world-id",
        name: "Area with Invalid World",
        description: "This area references a world that doesn't exist",
        landmarks: [],
        connections: [],
        tags: ["test"],
      };

      // Mock the repository method to throw an error
      jest
        .spyOn(repository, "update")
        .mockRejectedValue(
          new Error(
            'Referenced entity not found: worlds._id with value "non-existent-world-id"'
          )
        );

      // Act & Assert
      await expect(service.update(areaData)).rejects.toThrow(
        'Referenced entity not found: worlds._id with value "non-existent-world-id"'
      );
    });

    it("should return null when area to update is not found", async () => {
      // Arrange
      const areaData = {
        _id: "non-existent-id",
        worldId: "world-id-123",
        name: "Area Name",
        description: "Description",
        landmarks: [],
        connections: [],
        tags: ["test"],
      };

      // Mock the repository method
      jest.spyOn(repository, "update").mockResolvedValue(null);

      // Act
      const result = await service.update(areaData);

      // Assert
      expect(repository.update).toHaveBeenCalledWith(areaData);
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should call repository.delete with the correct parameters", async () => {
      // Arrange
      const id = "area-id-123";

      // Mock the repository method
      jest.spyOn(repository, "delete").mockResolvedValue(true);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it("should return null when area to delete is not found", async () => {
      // Arrange
      const id = "non-existent-id";

      // Mock the repository method
      jest.spyOn(repository, "delete").mockResolvedValue(null);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });

    it("should handle deleting multiple areas by IDs", async () => {
      // Arrange
      const ids = ["area-id-1", "area-id-2"];

      // Mock the repository method
      jest.spyOn(repository, "delete").mockResolvedValue(true);

      // Act
      const result = await service.delete(ids);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(ids);
      expect(result).toBe(true);
    });
  });
});
