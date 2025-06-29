import { Test, TestingModule } from "@nestjs/testing";
import { BulkItemizedResponse } from "@orbital/bulk-operations";
import { Area as CoreArea } from "@orbital/core";
import { Area } from "@orbital/typegoose";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";

describe("AreasService", () => {
  let service: AreasService;
  let repository: AreasRepository;

  // Create a mock area using CoreArea.mock()
  const mockArea = CoreArea.mock({
    _id: "test-id-123",
    name: "Test Area",
    worldId: "world1",
    tags: ["tag1", "tag2"],
  });

  // Create a mock Area by adding database-specific properties
  const mockAreaModel = {
    ...mockArea,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create a mock WithDocument wrapper (which is the domain object with an optional document property)
  const createWithDocumentMock = (domainObject, document) => {
    return {
      ...domainObject,
      document,
    };
  };

  // Create a mock WithDocument for the area
  const mockAreaWithDocument = createWithDocumentMock(mockArea, mockAreaModel);

  const mockAreasRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByWorldId: jest.fn(),
    findByParentId: jest.fn(),
    findByTags: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasService,
        {
          provide: AreasRepository,
          useValue: mockAreasRepository,
        },
      ],
    }).compile();

    service = module.get<AreasService>(AreasService);
    repository = module.get<AreasRepository>(AreasRepository);
  });

  describe("create", () => {
    it("should create a new area", async () => {
      // Create a partial Area model for creation
      const createAreaData = {
        name: mockArea.name,
        description: mockArea.description,
        position: mockArea.position,
        worldId: "world1",
      };

      // Repository returns WithDocument, which is already the domain object
      mockAreasRepository.create.mockResolvedValue(mockAreaWithDocument);

      const result = await service.create(createAreaData as any);

      expect(result).toEqual(mockAreaWithDocument);
      expect(mockAreasRepository.create).toHaveBeenCalledWith(createAreaData);
    });

    it("should handle bulk creation", async () => {
      const createAreaData = [
        {
          name: "Area 1",
          worldId: "world1",
          description: "",
          landmarks: [],
          connections: [],
          tags: [],
        },
        {
          name: "Area 2",
          worldId: "world1",
          description: "",
          landmarks: [],
          connections: [],
          tags: [],
        },
      ];

      const mockBulkResponse = new BulkItemizedResponse();
      mockAreasRepository.create.mockResolvedValue(mockBulkResponse);

      const result = await service.create(createAreaData as any);

      expect(result).toBe(mockBulkResponse);
      expect(mockAreasRepository.create).toHaveBeenCalledWith(createAreaData);
    });
  });

  describe("findById", () => {
    it("should get an area by id", async () => {
      // Repository returns WithDocument, which is already the domain object
      mockAreasRepository.findById.mockResolvedValue(mockAreaWithDocument);

      const result = await service.findById(mockArea._id);

      expect(result).toEqual(mockAreaWithDocument);
      expect(mockAreasRepository.findById).toHaveBeenCalledWith(
        mockArea._id,
        undefined
      );
    });

    it("should return null if area not found", async () => {
      mockAreasRepository.findById.mockResolvedValue(null);

      const result = await service.findById("nonexistent-id");

      expect(result).toBeNull();
      expect(mockAreasRepository.findById).toHaveBeenCalledWith(
        "nonexistent-id",
        undefined
      );
    });
  });

  describe("find", () => {
    it("should get all areas with optional filter and projection", async () => {
      const filter = { worldId: "world1" };
      const projection = { name: 1, description: 1 };

      // Repository returns array of WithDocument, which are already domain objects
      mockAreasRepository.find.mockResolvedValue([mockAreaWithDocument]);

      const result = await service.find(filter, projection);

      // The result includes the document property, so we need to check specific properties
      expect(result[0]._id).toEqual(mockArea._id);
      expect(result[0].name).toEqual(mockArea.name);
      expect(result[0].worldId).toEqual(mockArea.worldId);
      expect(mockAreasRepository.find).toHaveBeenCalledWith(
        filter,
        projection,
        undefined
      );
    });
  });

  describe("update", () => {
    it("should update an area by id", async () => {
      const _id = mockArea._id;
      const updateData = {
        name: "Updated Area",
        description: "Updated Description",
      };

      const updatedArea = {
        ...mockArea,
        name: "Updated Area",
        description: "Updated Description",
      };

      const updatedAreaWithDocument = createWithDocumentMock(updatedArea, {
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });

      // Repository returns WithDocument, which is already the domain object
      mockAreasRepository.update.mockResolvedValue(updatedAreaWithDocument);

      // Create a proper Area instance for the update
      // Create an Area instance for the update
      const areaToUpdate = new Area({
        _id,
        name: "Updated Area",
        description: "Updated Description",
        worldId: mockArea.worldId,
        tags: mockArea.tags,
        landmarks: [],
        connections: [],
      });

      const result = await service.update(areaToUpdate);

      // The result includes the document property, so we need to check specific properties
      expect(result._id).toEqual(updatedArea._id);
      expect(result.name).toEqual(updatedArea.name);
      expect(result.description).toEqual(updatedArea.description);
      // We're passing an Area instance, not a plain object
      expect(mockAreasRepository.update).toHaveBeenCalledWith(areaToUpdate);
    });

    it("should return null if area not found", async () => {
      const _id = "nonexistent-id";
      const updateData = {
        name: "Updated Area",
      };

      mockAreasRepository.update.mockResolvedValue(null);

      // Create a proper Area instance for the update
      // Create an Area instance for the update
      const areaToUpdate = new Area({
        _id,
        name: "Updated Area",
        worldId: "world1",
        tags: ["tag1"],
        description: "",
        landmarks: [],
        connections: [],
      });

      const result = await service.update(areaToUpdate);

      expect(result).toBeNull();
      // We're passing an Area instance, not a plain object
      expect(mockAreasRepository.update).toHaveBeenCalledWith(areaToUpdate);
    });

    it("should handle bulk updates", async () => {
      const updateData = [
        new Area({
          _id: "id1",
          name: "Updated Area 1",
          worldId: "world1",
          tags: ["tag1"],
          description: "",
          landmarks: [],
          connections: [],
        }),
        new Area({
          _id: "id2",
          name: "Updated Area 2",
          worldId: "world1",
          tags: ["tag2"],
          description: "",
          landmarks: [],
          connections: [],
        }),
      ];

      const mockBulkResponse = new BulkItemizedResponse();
      mockAreasRepository.update.mockResolvedValue(mockBulkResponse);

      const result = await service.update(updateData as any);

      expect(result).toBe(mockBulkResponse);
      expect(mockAreasRepository.update).toHaveBeenCalledWith(updateData);
    });
  });

  describe("delete", () => {
    it("should delete an area by id", async () => {
      mockAreasRepository.delete.mockResolvedValue(true);

      const result = await service.delete(mockArea._id);

      expect(result).toBe(true);
      expect(mockAreasRepository.delete).toHaveBeenCalledWith(mockArea._id);
    });

    it("should return null if area not found", async () => {
      mockAreasRepository.delete.mockResolvedValue(null);

      const result = await service.delete("nonexistent-id");

      expect(result).toBeNull();
      expect(mockAreasRepository.delete).toHaveBeenCalledWith("nonexistent-id");
    });
  });

  describe("findByWorldId", () => {
    it("should get areas by world id", async () => {
      // Repository returns array of WithDocument, which are already domain objects
      mockAreasRepository.findByWorldId.mockResolvedValue([
        mockAreaWithDocument,
      ]);

      const result = await service.findByWorldId("world1");

      expect(result[0]._id).toEqual(mockArea._id);
      expect(result[0].name).toEqual(mockArea.name);
      expect(result[0].worldId).toEqual(mockArea.worldId);
      expect(mockAreasRepository.findByWorldId).toHaveBeenCalledWith("world1");
    });
  });

  describe("findByParentId", () => {
    it("should get areas by parent id", async () => {
      const parentId = mockArea.parentId || null;

      // Repository returns array of WithDocument, which are already domain objects
      mockAreasRepository.findByParentId.mockResolvedValue([
        mockAreaWithDocument,
      ]);

      const result = await service.findByParentId(parentId);

      // The result includes the document property, so we need to check specific properties
      expect(result[0]._id).toEqual(mockArea._id);
      expect(result[0].name).toEqual(mockArea.name);
      expect(result[0].worldId).toEqual(mockArea.worldId);
      expect(mockAreasRepository.findByParentId).toHaveBeenCalledWith(
        parentId,
        undefined,
        undefined
      );
    });
  });

  describe("findByTags", () => {
    it("should get areas by tags", async () => {
      const tags = ["tag1", "tag2"];

      // Repository returns array of WithDocument, which are already domain objects
      mockAreasRepository.findByTags.mockResolvedValue([mockAreaWithDocument]);

      const result = await service.findByTags(tags);

      // The result includes the document property, so we need to check specific properties
      expect(result[0]._id).toEqual(mockArea._id);
      expect(result[0].name).toEqual(mockArea.name);
      expect(result[0].worldId).toEqual(mockArea.worldId);
      expect(mockAreasRepository.findByTags).toHaveBeenCalledWith(
        tags,
        undefined,
        undefined
      );
    });
  });
});
