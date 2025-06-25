import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "nestjs-typegoose";
import { AreasRepository } from "./areas.repository";
import { AreaModel } from "@orbital/typegoose";
import { Area } from "@orbital/core";

describe("AreasRepository", () => {
  let repository: AreasRepository;
  let areaModelMock: any;

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
    save: jest.fn().mockResolvedValue(mockArea),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a mock for the AreaModel
    areaModelMock = function () {
      return {
        ...mockAreaModel,
        save: jest.fn().mockResolvedValue(mockAreaModel),
      };
    };
    areaModelMock.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockAreaModel]),
    });
    areaModelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAreaModel),
    });
    areaModelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAreaModel),
    });
    areaModelMock.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAreaModel),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasRepository,
        {
          provide: getModelToken("AreaModel"),
          useValue: areaModelMock,
        },
      ],
    }).compile();

    repository = module.get<AreasRepository>(AreasRepository);
  });

  describe("create", () => {
    it("should create and save a new area", async () => {
      const createAreaDto = {
        name: mockArea.name,
        description: mockArea.description,
        position: mockArea.position,
        worldId: "world1",
      };

      const result = await repository.create(createAreaDto);

      expect(result).toEqual(mockAreaModel);
      expect(areaModelMock).toHaveBeenCalledWith(createAreaDto);
    });
  });

  describe("findById", () => {
    it("should find an area by id", async () => {
      const result = await repository.findById(mockArea._id);

      expect(result).toEqual(mockAreaModel);
      expect(areaModelMock.findById).toHaveBeenCalledWith(mockArea._id);
    });
  });

  describe("findAll", () => {
    it("should find all areas with optional filter and projection", async () => {
      const filter = { worldId: "world1" };
      const projection = { name: 1, description: 1 };

      const result = await repository.findAll(filter, projection);

      expect(result).toEqual([mockAreaModel]);
      expect(areaModelMock.find).toHaveBeenCalledWith(filter, projection);
    });
  });

  describe("update", () => {
    it("should update an area by id", async () => {
      const updateAreaDto = {
        name: "Updated Area",
        description: "Updated Description",
      };

      const result = await repository.update(mockArea._id, updateAreaDto);

      expect(result).toEqual(mockAreaModel);
      expect(areaModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockArea._id,
        updateAreaDto,
        { new: true }
      );
    });
  });

  describe("delete", () => {
    it("should delete an area by id", async () => {
      const result = await repository.delete(mockArea._id);

      expect(result).toEqual(mockAreaModel);
      expect(areaModelMock.findByIdAndDelete).toHaveBeenCalledWith(
        mockArea._id
      );
    });
  });

  describe("findByWorldId", () => {
    it("should find areas by world id", async () => {
      const result = await repository.findByWorldId("world1");

      expect(result).toEqual([mockAreaModel]);
      expect(areaModelMock.find).toHaveBeenCalledWith({ worldId: "world1" });
    });
  });

  describe("findByParentId", () => {
    it("should find areas by parent id", async () => {
      const parentId = mockArea.parentId || null;
      const result = await repository.findByParentId(parentId);

      expect(result).toEqual([mockAreaModel]);
      expect(areaModelMock.find).toHaveBeenCalledWith({
        parentId: mockArea.parentId,
      });
    });
  });

  describe("findByTags", () => {
    it("should find areas by tags", async () => {
      const tags = ["tag1", "tag2"];
      const result = await repository.findByTags(tags);

      expect(result).toEqual([mockAreaModel]);
      expect(areaModelMock.find).toHaveBeenCalledWith({ tags: { $in: tags } });
    });
  });
});
