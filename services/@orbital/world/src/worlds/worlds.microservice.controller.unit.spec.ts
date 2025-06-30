import { Test, TestingModule } from "@nestjs/testing";
import { WithoutId } from "@orbital/core";
import { CRUDController } from "@orbital/nest";
import { WithId, WorldModel } from "@orbital/typegoose";
import { WorldsCRUDService } from "./worlds.crud.service";
import { WorldsMicroserviceController } from "./worlds.microservice.controller";

describe("WorldsMicroserviceController", () => {
  let controller: WorldsMicroserviceController;
  let service: WorldsCRUDService;

  beforeEach(async () => {
    // Create mock service
    const mockService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByShard: jest.fn(),
      findByTechLevel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorldsMicroserviceController],
      providers: [
        {
          provide: WorldsCRUDService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WorldsMicroserviceController>(
      WorldsMicroserviceController
    );
    service = module.get<WorldsCRUDService>(WorldsCRUDService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should be an instance of CRUDController", () => {
    expect(controller).toBeInstanceOf(CRUDController);
  });

  describe("create", () => {
    it("should call service.create with the provided dto", async () => {
      // Arrange
      const dto: WithoutId<WorldModel> = {
        name: "Test World",
        shard: "test-shard",
        techLevel: 5,
      } as WithoutId<WorldModel>;
      const expectedResult = { ...dto, _id: "test-id" } as WorldModel;

      jest.spyOn(service, "create").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("find", () => {
    it("should call service.find with the provided payload", async () => {
      // Arrange
      const payload = {
        filter: { shard: "test-shard" },
        projection: { name: 1 },
        options: { sort: { name: 1 } },
      };
      const expectedResult = [
        { _id: "world-1", name: "World 1" },
        { _id: "world-2", name: "World 2" },
      ] as WorldModel[];

      jest.spyOn(service, "find").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.find(payload);

      // Assert
      expect(service.find).toHaveBeenCalledWith(
        payload.filter,
        payload.projection,
        payload.options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call service.findById with the provided payload", async () => {
      // Arrange
      const payload = {
        id: "test-id",
        projection: { name: 1 },
      };
      const expectedResult = {
        _id: "test-id",
        name: "Test World",
      } as WorldModel;

      jest.spyOn(service, "findById").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findById(payload);

      // Assert
      expect(service.findById).toHaveBeenCalledWith(
        payload.id,
        payload.projection
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with the provided data", async () => {
      // Arrange
      const data: WithId<WorldModel> = {
        _id: "test-id",
        name: "Updated World",
        shard: "test-shard",
        techLevel: 5,
      } as WithId<WorldModel>;
      const expectedResult = { ...data } as WorldModel;

      jest.spyOn(service, "update").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(data);

      // Assert
      expect(service.update).toHaveBeenCalledWith(data);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call service.delete with the provided ids", async () => {
      // Arrange
      const ids = "test-id";
      const expectedResult = true;

      jest.spyOn(service, "delete").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.delete(ids);

      // Assert
      expect(service.delete).toHaveBeenCalledWith(ids);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByShard", () => {
    it("should call service.findByShard with the provided payload", async () => {
      // Arrange
      const payload = {
        shard: "test-shard",
        projection: { name: 1 },
        options: { sort: { name: 1 } },
      };
      const expectedResult = [
        { _id: "world-1", name: "World 1" },
        { _id: "world-2", name: "World 2" },
      ] as WorldModel[];

      jest.spyOn(service, "findByShard").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByShard(payload);

      // Assert
      expect(service.findByShard).toHaveBeenCalledWith(
        payload.shard,
        payload.projection,
        payload.options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByTechLevel", () => {
    it("should call service.findByTechLevel with the provided payload", async () => {
      // Arrange
      const payload = {
        techLevel: 5,
        projection: { name: 1 },
        options: { sort: { name: 1 } },
      };
      const expectedResult = [
        { _id: "world-1", name: "World 1" },
        { _id: "world-2", name: "World 2" },
      ] as WorldModel[];

      jest.spyOn(service, "findByTechLevel").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByTechLevel(payload);

      // Assert
      expect(service.findByTechLevel).toHaveBeenCalledWith(
        payload.techLevel,
        payload.projection,
        payload.options
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
