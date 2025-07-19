import { Test, TestingModule } from "@nestjs/testing";
import { WithoutId } from "@orbital/core";
import { WorldModel } from "@orbital/typegoose";
import { WorldService } from "./world.service";
import { WorldsCRUDService } from "./worlds.crud.service";
import { WorldProps } from "./worlds.repository";

describe("WorldService", () => {
  let service: WorldService;
  let mockWorldsCrudService: Partial<WorldsCRUDService>;

  beforeEach(async () => {
    // Create mock implementation of WorldsCRUDService
    mockWorldsCrudService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByShard: jest.fn(),
      findByTechLevel: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorldService,
        {
          provide: WorldsCRUDService,
          useValue: mockWorldsCrudService,
        },
      ],
    }).compile();

    service = module.get<WorldService>(WorldService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should call worldsCrudService.create with the provided dto", async () => {
      const dto: WithoutId<WorldProps> = {
        name: "Test World",
        shard: "test-shard",
        techLevel: 5,
        locations: [],
      };
      const expectedResult = { ...dto, _id: "test-id" } as WorldModel;

      (mockWorldsCrudService.create as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.create(dto);

      expect(mockWorldsCrudService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("find", () => {
    it("should call worldsCrudService.find with the provided parameters", async () => {
      const filter = { shard: "test-shard" };
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test World" },
      ] as WorldModel[];

      (mockWorldsCrudService.find as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.find(filter, projection, options);

      expect(mockWorldsCrudService.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call worldsCrudService.findById with the provided id", async () => {
      const id = "test-id";
      const projection = { name: 1 };
      const expectedResult = { _id: id, name: "Test World" } as WorldModel;

      (mockWorldsCrudService.findById as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findById(id, projection);

      expect(mockWorldsCrudService.findById).toHaveBeenCalledWith(
        id,
        projection
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByShard", () => {
    it("should call worldsCrudService.findByShard with the provided shard", async () => {
      const shard = "test-shard";
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test World" },
      ] as WorldModel[];

      (mockWorldsCrudService.findByShard as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findByShard(shard, projection, options);

      expect(mockWorldsCrudService.findByShard).toHaveBeenCalledWith(
        shard,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByTechLevel", () => {
    it("should call worldsCrudService.findByTechLevel with the provided techLevel", async () => {
      const techLevel = 5;
      const projection = { name: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", name: "Test World" },
      ] as WorldModel[];

      (mockWorldsCrudService.findByTechLevel as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findByTechLevel(
        techLevel,
        projection,
        options
      );

      expect(mockWorldsCrudService.findByTechLevel).toHaveBeenCalledWith(
        techLevel,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call worldsCrudService.update with the provided entities", async () => {
      const entity = { _id: "test-id", name: "Updated World" };
      const expectedResult = { ...entity } as WorldModel;

      (mockWorldsCrudService.update as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.update(entity);

      expect(mockWorldsCrudService.update).toHaveBeenCalledWith(entity);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call worldsCrudService.delete with the provided ids", async () => {
      const id = "test-id";
      const expectedResult = true;

      (mockWorldsCrudService.delete as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.delete(id);

      expect(mockWorldsCrudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
