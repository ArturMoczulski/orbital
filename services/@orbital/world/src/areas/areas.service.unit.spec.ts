import { Test, TestingModule } from "@nestjs/testing";
import { Area as CoreArea } from "@orbital/core";
import { AreaModel as Area } from "@orbital/typegoose";
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
      const createAreaData: Partial<Area> = {
        name: mockArea.name,
        description: mockArea.description,
        position: mockArea.position,
        worldId: "world1",
      };

      mockAreasRepository.create.mockResolvedValue(mockAreaModel);

      const result = await service.create(createAreaData as any);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasRepository.create).toHaveBeenCalledWith(createAreaData);
    });
  });

  describe("findById", () => {
    it("should get an area by id", async () => {
      mockAreasRepository.findById.mockResolvedValue(mockAreaModel);

      const result = await service.findById(mockArea._id);

      expect(result).toEqual(mockAreaModel);
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

      mockAreasRepository.find.mockResolvedValue([mockAreaModel]);

      const result = await service.find(filter);

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.find).toHaveBeenCalledWith(
        filter,
        undefined,
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

      mockAreasRepository.update.mockResolvedValue({
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });

      const result = await service.update({ _id, ...updateData });

      expect(result).toEqual({
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });
      expect(mockAreasRepository.update).toHaveBeenCalledWith({
        _id,
        ...updateData,
      });
    });

    it("should return null if area not found", async () => {
      const _id = "nonexistent-id";
      const updateData = {
        name: "Updated Area",
      };

      mockAreasRepository.update.mockResolvedValue(null);

      const result = await service.update({ _id, ...updateData });

      expect(result).toBeNull();
      expect(mockAreasRepository.update).toHaveBeenCalledWith({
        _id,
        ...updateData,
      });
    });
  });

  describe("delete", () => {
    it("should delete an area by id", async () => {
      mockAreasRepository.delete.mockResolvedValue(mockAreaModel);

      const result = await service.delete(mockArea._id);

      expect(result).toEqual(mockAreaModel);
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
      mockAreasRepository.findByWorldId.mockResolvedValue([mockAreaModel]);

      const result = await service.findByWorldId("world1");

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.findByWorldId).toHaveBeenCalledWith("world1");
    });
  });

  describe("findByParentId", () => {
    it("should get areas by parent id", async () => {
      const parentId = mockArea.parentId || null;
      mockAreasRepository.findByParentId.mockResolvedValue([mockAreaModel]);

      const result = await service.findByParentId(parentId);

      expect(result).toEqual([mockAreaModel]);
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
      mockAreasRepository.findByTags.mockResolvedValue([mockAreaModel]);

      const result = await service.findByTags(tags);

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.findByTags).toHaveBeenCalledWith(tags);
    });
  });
});
