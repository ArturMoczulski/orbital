import { Test, TestingModule } from "@nestjs/testing";
import { AreaProps, WithoutId } from "@orbital/core";
import { AreaModel } from "@orbital/typegoose";
import { AreaService } from "./area.service";
import { AreasCRUDService } from "./areas.crud.service";

describe("AreaService", () => {
  let service: AreaService;
  let mockAreasCrudService: Partial<AreasCRUDService>;

  beforeEach(async () => {
    // Create mock implementation of AreasCRUDService
    mockAreasCrudService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByWorldId: jest.fn(),
      findByParentId: jest.fn(),
      findByTags: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaService,
        {
          provide: AreasCRUDService,
          useValue: mockAreasCrudService,
        },
      ],
    }).compile();

    service = module.get<AreaService>(AreaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should call areasCrudService.create with the provided dto", async () => {
      const dto: WithoutId<AreaProps> = {
        name: "Test Area",
        worldId: "test-world-id",
        description: "Test description",
        landmarks: [],
        connections: [],
        tags: ["test"],
      };
      const expectedResult = { ...dto, _id: "test-id" } as AreaModel;

      (mockAreasCrudService.create as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.create(dto);

      expect(mockAreasCrudService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("find", () => {
    it("should call areasCrudService.find with the provided parameters", async () => {
      const filter = { worldId: "test-world-id" };
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test Area" },
      ] as AreaModel[];

      (mockAreasCrudService.find as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.find(filter, projection, options);

      expect(mockAreasCrudService.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call areasCrudService.findById with the provided id", async () => {
      const id = "test-id";
      const projection = { name: 1 };
      const expectedResult = { _id: id, name: "Test Area" } as AreaModel;

      (mockAreasCrudService.findById as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findById(id, projection);

      expect(mockAreasCrudService.findById).toHaveBeenCalledWith(
        id,
        projection
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByWorldId", () => {
    it("should call areasCrudService.findByWorldId with the provided worldId", async () => {
      const worldId = "test-world-id";
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test Area" },
      ] as AreaModel[];

      (mockAreasCrudService.findByWorldId as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findByWorldId(worldId, projection, options);

      expect(mockAreasCrudService.findByWorldId).toHaveBeenCalledWith(
        worldId,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByParentId", () => {
    it("should call areasCrudService.findByParentId with the provided parentId", async () => {
      const parentId = "test-parent-id";
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test Area" },
      ] as AreaModel[];

      (mockAreasCrudService.findByParentId as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findByParentId(
        parentId,
        projection,
        options
      );

      expect(mockAreasCrudService.findByParentId).toHaveBeenCalledWith(
        parentId,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByTags", () => {
    it("should call areasCrudService.findByTags with the provided tags", async () => {
      const tags = ["tag1", "tag2"];
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test Area" },
      ] as AreaModel[];

      (mockAreasCrudService.findByTags as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findByTags(tags, projection, options);

      expect(mockAreasCrudService.findByTags).toHaveBeenCalledWith(
        tags,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call areasCrudService.update with the provided entities", async () => {
      const entity = { _id: "test-id", name: "Updated Area" };
      const expectedResult = { ...entity } as AreaModel;

      (mockAreasCrudService.update as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.update(entity);

      expect(mockAreasCrudService.update).toHaveBeenCalledWith(entity);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call areasCrudService.delete with the provided ids", async () => {
      const id = "test-id";
      const expectedResult = true;

      (mockAreasCrudService.delete as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.delete(id);

      expect(mockAreasCrudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
