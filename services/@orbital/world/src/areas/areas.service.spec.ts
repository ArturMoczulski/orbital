import { Test, TestingModule } from "@nestjs/testing";
import { AreasService } from "./areas.service";
import { AreasRepository } from "./areas.repository";
import { Area } from "@orbital/core";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

describe("AreasService", () => {
  let service: AreasService;
  let repository: AreasRepository;

  // Use Area.mock() to create a mock area
  const mockArea = Area.mock();

  // Convert the Area to an AreaModel-like object
  const mockAreaModel = {
    _id: mockArea._id,
    name: mockArea.name,
    description: mockArea.description,
    position: mockArea.position,
    areaMap: mockArea.areaMap,
    parentId: mockArea.parentId,
    worldId: "world1",
    landmarks: mockArea.landmarks,
    connections: mockArea.connections,
    tags: ["tag1", "tag2"],
  };

  const mockAreasRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
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

  describe("createArea", () => {
    it("should create a new area", async () => {
      const createAreaDto: CreateAreaDto = {
        name: mockArea.name,
        description: mockArea.description,
        position: mockArea.position,
        worldId: "world1",
      };

      mockAreasRepository.create.mockResolvedValue(mockAreaModel);

      const result = await service.createArea(createAreaDto);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasRepository.create).toHaveBeenCalledWith(createAreaDto);
    });
  });

  describe("getArea", () => {
    it("should get an area by id", async () => {
      mockAreasRepository.findById.mockResolvedValue(mockAreaModel);

      const result = await service.getArea(mockArea._id);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasRepository.findById).toHaveBeenCalledWith(mockArea._id);
    });

    it("should return null if area not found", async () => {
      mockAreasRepository.findById.mockResolvedValue(null);

      const result = await service.getArea("nonexistent-id");

      expect(result).toBeNull();
      expect(mockAreasRepository.findById).toHaveBeenCalledWith(
        "nonexistent-id"
      );
    });
  });

  describe("getAllAreas", () => {
    it("should get all areas with optional filter and projection", async () => {
      const filter = { worldId: "world1" };
      const projection = { name: 1, description: 1 };

      mockAreasRepository.findAll.mockResolvedValue([mockAreaModel]);

      const result = await service.getAllAreas(filter, projection);

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.findAll).toHaveBeenCalledWith(
        filter,
        projection
      );
    });
  });

  describe("updateArea", () => {
    it("should update an area by id", async () => {
      const updateAreaDto: UpdateAreaDto = {
        name: "Updated Area",
        description: "Updated Description",
      };

      mockAreasRepository.update.mockResolvedValue({
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });

      const result = await service.updateArea(mockArea._id, updateAreaDto);

      expect(result).toEqual({
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });
      expect(mockAreasRepository.update).toHaveBeenCalledWith(
        mockArea._id,
        updateAreaDto
      );
    });

    it("should return null if area not found", async () => {
      const updateAreaDto: UpdateAreaDto = {
        name: "Updated Area",
      };

      mockAreasRepository.update.mockResolvedValue(null);

      const result = await service.updateArea("nonexistent-id", updateAreaDto);

      expect(result).toBeNull();
      expect(mockAreasRepository.update).toHaveBeenCalledWith(
        "nonexistent-id",
        updateAreaDto
      );
    });
  });

  describe("deleteArea", () => {
    it("should delete an area by id", async () => {
      mockAreasRepository.delete.mockResolvedValue(mockAreaModel);

      const result = await service.deleteArea(mockArea._id);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasRepository.delete).toHaveBeenCalledWith(mockArea._id);
    });

    it("should return null if area not found", async () => {
      mockAreasRepository.delete.mockResolvedValue(null);

      const result = await service.deleteArea("nonexistent-id");

      expect(result).toBeNull();
      expect(mockAreasRepository.delete).toHaveBeenCalledWith("nonexistent-id");
    });
  });

  describe("getAreasByWorldId", () => {
    it("should get areas by world id", async () => {
      mockAreasRepository.findByWorldId.mockResolvedValue([mockAreaModel]);

      const result = await service.getAreasByWorldId("world1");

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.findByWorldId).toHaveBeenCalledWith("world1");
    });
  });

  describe("getAreasByParentId", () => {
    it("should get areas by parent id", async () => {
      const parentId = mockArea.parentId || null;
      mockAreasRepository.findByParentId.mockResolvedValue([mockAreaModel]);

      const result = await service.getAreasByParentId(parentId);

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.findByParentId).toHaveBeenCalledWith(parentId);
    });
  });

  describe("getAreasByTags", () => {
    it("should get areas by tags", async () => {
      const tags = ["tag1", "tag2"];
      mockAreasRepository.findByTags.mockResolvedValue([mockAreaModel]);

      const result = await service.getAreasByTags(tags);

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasRepository.findByTags).toHaveBeenCalledWith(tags);
    });
  });
});
