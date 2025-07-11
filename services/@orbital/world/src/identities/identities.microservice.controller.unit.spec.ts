import { Test, TestingModule } from "@nestjs/testing";
import { WithId, WithoutId } from "@orbital/core";
import { IdentityAccount } from "@orbital/identity-types";
import { CRUDController } from "@orbital/nest";
import { IdentitiesCRUDService } from "./identities.crud.service";
import { IdentitiesMicroserviceController } from "./identities.microservice.controller";

describe("IdentitiesMicroserviceController", () => {
  let controller: IdentitiesMicroserviceController;
  let service: IdentitiesCRUDService;

  beforeEach(async () => {
    // Create mock service
    const mockService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCharacterId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdentitiesMicroserviceController],
      providers: [
        {
          provide: IdentitiesCRUDService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<IdentitiesMicroserviceController>(
      IdentitiesMicroserviceController
    );
    service = module.get<IdentitiesCRUDService>(IdentitiesCRUDService);
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
      const dto: WithoutId<IdentityAccount> = {
        characterId: "test-character-id",
        provider: "local",
        identifier: "test-user",
        credentials: [],
      } as unknown as WithoutId<IdentityAccount>;

      const expectedResult = {
        _id: "test-id",
        ...dto,
      } as unknown as IdentityAccount;

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
        filter: { provider: "local" },
        projection: { identifier: 1 },
        options: { sort: { identifier: 1 } },
      };
      const expectedResult = [
        { _id: "identity-1", identifier: "user1" },
        { _id: "identity-2", identifier: "user2" },
      ] as unknown as IdentityAccount[];

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
        projection: { identifier: 1 },
      };
      const expectedResult = {
        _id: "test-id",
        identifier: "test-user",
      } as unknown as IdentityAccount;

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
      const data: WithId<IdentityAccount> = {
        _id: "test-id",
        characterId: "test-character-id",
        provider: "local",
        identifier: "updated-user",
        credentials: [],
      } as unknown as WithId<IdentityAccount>;

      const expectedResult = { ...data } as unknown as IdentityAccount;

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

  describe("findByCharacterId", () => {
    it("should call service.findByCharacterId with the provided payload", async () => {
      // Arrange
      const payload = {
        characterId: "test-character-id",
        projection: { identifier: 1 },
        options: { sort: { identifier: 1 } },
      };
      const expectedResult = [
        { _id: "identity-1", identifier: "user1" },
        { _id: "identity-2", identifier: "user2" },
      ] as unknown as IdentityAccount[];

      jest
        .spyOn(service, "findByCharacterId")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByCharacterId(payload);

      // Assert
      expect(service.findByCharacterId).toHaveBeenCalledWith(
        payload.characterId,
        payload.projection,
        payload.options
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
