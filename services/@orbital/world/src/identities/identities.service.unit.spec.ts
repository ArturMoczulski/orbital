import { Test, TestingModule } from "@nestjs/testing";
import { BulkCountedResponse } from "@orbital/bulk-operations";
import { WithoutId } from "@orbital/core";
import { IdentityAccount } from "@orbital/identity-types";
import { IdentitiesCRUDService } from "./identities.crud.service";
import { IdentitiesService } from "./identities.service";

describe("IdentitiesService", () => {
  let service: IdentitiesService;
  let mockIdentitiesCrudService: Partial<IdentitiesCRUDService>;

  beforeEach(async () => {
    // Create mock implementation of IdentitiesCRUDService
    mockIdentitiesCrudService = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByCharacterId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentitiesService,
        {
          provide: IdentitiesCRUDService,
          useValue: mockIdentitiesCrudService,
        },
      ],
    }).compile();

    service = module.get<IdentitiesService>(IdentitiesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should call identitiesCrudService.create with the provided dto", async () => {
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

      (mockIdentitiesCrudService.create as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.create(dto);

      expect(mockIdentitiesCrudService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("find", () => {
    it("should call identitiesCrudService.find with the provided parameters", async () => {
      const filter = { provider: "local" };
      const projection = { identifier: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", identifier: "test-user" },
      ] as unknown as IdentityAccount[];

      (mockIdentitiesCrudService.find as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.find(filter, projection, options);

      expect(mockIdentitiesCrudService.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call identitiesCrudService.findById with the provided id", async () => {
      const id = "test-id";
      const projection = { identifier: 1 };
      const expectedResult = {
        _id: id,
        identifier: "test-user",
      } as unknown as IdentityAccount;

      (mockIdentitiesCrudService.findById as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.findById(id, projection);

      expect(mockIdentitiesCrudService.findById).toHaveBeenCalledWith(
        id,
        projection
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByCharacterId", () => {
    it("should call identitiesCrudService.findByCharacterId with the provided characterId", async () => {
      const characterId = "test-character-id";
      const projection = { identifier: 1 };
      const options = { limit: 10 };
      const expectedResult = [
        { _id: "test-id", identifier: "test-user" },
      ] as unknown as IdentityAccount[];

      (
        mockIdentitiesCrudService.findByCharacterId as jest.Mock
      ).mockResolvedValue(expectedResult);

      const result = await service.findByCharacterId(
        characterId,
        projection,
        options
      );

      expect(mockIdentitiesCrudService.findByCharacterId).toHaveBeenCalledWith(
        characterId,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call identitiesCrudService.update with the provided entities", async () => {
      const entity = { _id: "test-id", identifier: "updated-user" };
      const expectedResult = { ...entity } as unknown as IdentityAccount;

      (mockIdentitiesCrudService.update as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.update(entity);

      expect(mockIdentitiesCrudService.update).toHaveBeenCalledWith(entity);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call identitiesCrudService.delete with the provided ids", async () => {
      const id = "test-id";
      const expectedResult = true;

      (mockIdentitiesCrudService.delete as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.delete(id);

      expect(mockIdentitiesCrudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it("should handle bulk delete operations", async () => {
      const ids = ["id1", "id2", "id3"];
      // Use a mock response without explicitly typing it
      const expectedResult = {
        counts: {
          success: 3,
          fail: 0,
        },
      };

      // Mock the response with type assertion
      (mockIdentitiesCrudService.delete as jest.Mock).mockResolvedValue(
        expectedResult as BulkCountedResponse
      );

      (mockIdentitiesCrudService.delete as jest.Mock).mockResolvedValue(
        expectedResult
      );

      const result = await service.delete(ids);

      expect(mockIdentitiesCrudService.delete).toHaveBeenCalledWith(ids);
      expect(result).toEqual(expectedResult);
    });
  });
});
