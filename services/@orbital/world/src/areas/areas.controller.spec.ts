import { Test, TestingModule } from "@nestjs/testing";
import { AreasController } from "./areas.controller";
import { AreasService } from "./areas.service";
import { Area } from "@orbital/core";
import { CreateAreaDto, UpdateAreaDto } from "./dto";

describe("AreasController", () => {
  let controller: AreasController;
  let service: AreasService;

  // Use Area.mock() to create a mock area
  const mockArea = Area.mock();

  // Convert the Area to an AreaModel-like object
  const mockAreaModel = {
    _id: mockArea.id,
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

  const mockAreasService = {
    createArea: jest.fn(),
    getArea: jest.fn(),
    getAllAreas: jest.fn(),
    updateArea: jest.fn(),
    deleteArea: jest.fn(),
    getAreasByWorldId: jest.fn(),
    getAreasByParentId: jest.fn(),
    getAreasByTags: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreasController],
      providers: [
        {
          provide: AreasService,
          useValue: mockAreasService,
        },
      ],
    }).compile();

    controller = module.get<AreasController>(AreasController);
    service = module.get<AreasService>(AreasService);
  });

  describe("createArea", () => {
    it("should create a new area", async () => {
      const createAreaDto: CreateAreaDto = {
        name: mockArea.name,
        description: mockArea.description,
        position: mockArea.position,
        worldId: "world1",
      };

      mockAreasService.createArea.mockResolvedValue(mockAreaModel);

      const result = await controller.createArea(createAreaDto);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasService.createArea).toHaveBeenCalledWith(createAreaDto);
    });
  });

  describe("getAllAreas", () => {
    it("should get all areas", async () => {
      mockAreasService.getAllAreas.mockResolvedValue([mockAreaModel]);

      const result = await controller.getAllAreas();

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasService.getAllAreas).toHaveBeenCalled();
    });
  });

  describe("getArea", () => {
    it("should get an area by id", async () => {
      mockAreasService.getArea.mockResolvedValue(mockAreaModel);

      const result = await controller.getArea(mockArea.id);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasService.getArea).toHaveBeenCalledWith(mockArea.id);
    });
  });

  describe("updateArea", () => {
    it("should update an area by id", async () => {
      const updateAreaDto: UpdateAreaDto = {
        name: "Updated Area",
        description: "Updated Description",
      };

      mockAreasService.updateArea.mockResolvedValue({
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });

      const result = await controller.updateArea(mockArea.id, updateAreaDto);

      expect(result).toEqual({
        ...mockAreaModel,
        name: "Updated Area",
        description: "Updated Description",
      });
      expect(mockAreasService.updateArea).toHaveBeenCalledWith(
        mockArea.id,
        updateAreaDto
      );
    });
  });

  describe("deleteArea", () => {
    it("should delete an area by id", async () => {
      mockAreasService.deleteArea.mockResolvedValue(mockAreaModel);

      const result = await controller.deleteArea(mockArea.id);

      expect(result).toEqual(mockAreaModel);
      expect(mockAreasService.deleteArea).toHaveBeenCalledWith(mockArea.id);
    });
  });

  describe("getAreasByWorldId", () => {
    it("should get areas by world id", async () => {
      mockAreasService.getAreasByWorldId.mockResolvedValue([mockAreaModel]);

      const result = await controller.getAreasByWorldId("world1");

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasService.getAreasByWorldId).toHaveBeenCalledWith("world1");
    });
  });

  describe("getAreasByParentId", () => {
    it("should get areas by parent id", async () => {
      mockAreasService.getAreasByParentId.mockResolvedValue([mockAreaModel]);

      const result = await controller.getAreasByParentId("parent1");

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasService.getAreasByParentId).toHaveBeenCalledWith(
        "parent1"
      );
    });

    it("should handle null parent id", async () => {
      mockAreasService.getAreasByParentId.mockResolvedValue([mockAreaModel]);

      const result = await controller.getAreasByParentId("null");

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasService.getAreasByParentId).toHaveBeenCalledWith(null);
    });
  });

  describe("getAreasByTags", () => {
    it("should get areas by tags", async () => {
      const tags = "tag1,tag2";
      mockAreasService.getAreasByTags.mockResolvedValue([mockAreaModel]);

      const result = await controller.getAreasByTags(tags);

      expect(result).toEqual([mockAreaModel]);
      expect(mockAreasService.getAreasByTags).toHaveBeenCalledWith([
        "tag1",
        "tag2",
      ]);
    });
  });
});
