import { Test, TestingModule } from "@nestjs/testing";
import { WorldMicroservice } from "@orbital/world-rpc";
import { IdentitiesService } from "./identities.service";

// Create a mock for the WorldMicroservice
const mockWorldMicroservice = {
  identities: {
    find: jest.fn(),
    findById: jest.fn(),
    findByCharacterId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("IdentitiesService", () => {
  let service: IdentitiesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentitiesService,
        {
          provide: WorldMicroservice,
          useValue: mockWorldMicroservice,
        },
      ],
    }).compile();

    service = module.get<IdentitiesService>(IdentitiesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("find", () => {
    it("should return an array of identity accounts", async () => {
      // Mock data
      const mockIdentities = [
        {
          _id: "identity1",
          provider: "local",
          identifier: "user1",
          characterId: "char1",
        },
        {
          _id: "identity2",
          provider: "google",
          identifier: "user2",
          characterId: "char2",
        },
      ];

      // Setup mock implementation
      mockWorldMicroservice.identities.find.mockResolvedValue(mockIdentities);

      // Execute
      const result = await service.find();

      // Assert
      expect(result).toEqual(mockIdentities);
      expect(mockWorldMicroservice.identities.find).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.find).toHaveBeenCalledWith({
        filter: {},
        projection: {},
        options: {},
      });
    });

    it("should return an empty array when null is returned", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.find.mockResolvedValue(null);

      // Execute
      const result = await service.find();

      // Assert
      expect(result).toEqual([]);
      expect(mockWorldMicroservice.identities.find).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.find.mockRejectedValue(
        new Error("Microservice error")
      );

      // Execute & Assert
      await expect(service.find()).rejects.toThrow("Microservice error");
      expect(mockWorldMicroservice.identities.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("should return a single identity account", async () => {
      // Mock data
      const mockIdentity = {
        _id: "identity1",
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.findById.mockResolvedValue(mockIdentity);

      // Execute
      const result = await service.findById("identity1");

      // Assert
      expect(result).toEqual(mockIdentity);
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledTimes(
        1
      );
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledWith({
        id: "identity1",
        projection: {},
      });
    });

    it("should throw an error when identity account is not found", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.findById.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.findById("nonexistent")).rejects.toThrow(
        "Identity account not found"
      );
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledTimes(
        1
      );
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledWith({
        id: "nonexistent",
        projection: {},
      });
    });

    it("should propagate errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.findById.mockRejectedValue(
        new Error("Microservice error")
      );

      // Execute & Assert
      await expect(service.findById("identity1")).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe("findByCharacterId", () => {
    it("should return an array of identity accounts for a character", async () => {
      // Mock data
      const characterId = "char1";
      const mockIdentities = [
        {
          _id: "identity1",
          provider: "local",
          identifier: "user1",
          characterId,
        },
        {
          _id: "identity2",
          provider: "google",
          identifier: "user2",
          characterId,
        },
      ];

      // Setup mock implementation
      mockWorldMicroservice.identities.findByCharacterId.mockResolvedValue(
        mockIdentities
      );

      // Execute
      const result = await service.findByCharacterId(characterId);

      // Assert
      expect(result).toEqual(mockIdentities);
      expect(
        mockWorldMicroservice.identities.findByCharacterId
      ).toHaveBeenCalledTimes(1);
      expect(
        mockWorldMicroservice.identities.findByCharacterId
      ).toHaveBeenCalledWith({
        characterId,
        projection: {},
        options: {},
      });
    });

    it("should return an empty array when null is returned", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.findByCharacterId.mockResolvedValue(
        null
      );

      // Execute
      const result = await service.findByCharacterId("char1");

      // Assert
      expect(result).toEqual([]);
      expect(
        mockWorldMicroservice.identities.findByCharacterId
      ).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors from the microservice", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.findByCharacterId.mockRejectedValue(
        new Error("Microservice error")
      );

      // Execute & Assert
      await expect(service.findByCharacterId("char1")).rejects.toThrow(
        "Microservice error"
      );
      expect(
        mockWorldMicroservice.identities.findByCharacterId
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("create", () => {
    it("should create a new identity account", async () => {
      // Mock data
      const createIdentityDto = {
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };
      const createdIdentity = {
        _id: "identity1",
        ...createIdentityDto,
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.create.mockResolvedValue(
        createdIdentity
      );

      // Execute
      const result = await service.create(createIdentityDto);

      // Assert
      expect(result).toEqual(createdIdentity);
      expect(mockWorldMicroservice.identities.create).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.create).toHaveBeenCalledWith(
        createIdentityDto
      );
    });

    it("should propagate errors from the microservice", async () => {
      // Mock data
      const createIdentityDto = {
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.create.mockRejectedValue(
        new Error("Microservice error")
      );

      // Execute & Assert
      await expect(service.create(createIdentityDto)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.identities.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("should update an existing identity account", async () => {
      // Mock data
      const identityId = "identity1";
      const updateIdentityDto = {
        provider: "updated-provider",
      };
      const updatedIdentity = {
        _id: identityId,
        provider: "updated-provider",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.update.mockResolvedValue(
        updatedIdentity
      );

      // Execute
      const result = await service.update(identityId, updateIdentityDto);

      // Assert
      expect(result).toEqual(updatedIdentity);
      expect(mockWorldMicroservice.identities.update).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.update).toHaveBeenCalledWith({
        _id: identityId,
        ...updateIdentityDto,
      });
    });

    it("should propagate errors from the microservice", async () => {
      // Mock data
      const identityId = "identity1";
      const updateIdentityDto = {
        provider: "updated-provider",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.update.mockRejectedValue(
        new Error("Microservice error")
      );

      // Execute & Assert
      await expect(
        service.update(identityId, updateIdentityDto)
      ).rejects.toThrow("Microservice error");
      expect(mockWorldMicroservice.identities.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("should delete an identity account", async () => {
      // Mock data
      const identityId = "identity1";
      const deletedIdentity = {
        _id: identityId,
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.delete.mockResolvedValue(
        deletedIdentity
      );

      // Execute
      const result = await service.delete(identityId);

      // Assert
      expect(result).toEqual(deletedIdentity);
      expect(mockWorldMicroservice.identities.delete).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.delete).toHaveBeenCalledWith(
        identityId
      );
    });

    it("should propagate errors from the microservice", async () => {
      // Mock data
      const identityId = "identity1";

      // Setup mock implementation
      mockWorldMicroservice.identities.delete.mockRejectedValue(
        new Error("Microservice error")
      );

      // Execute & Assert
      await expect(service.delete(identityId)).rejects.toThrow(
        "Microservice error"
      );
      expect(mockWorldMicroservice.identities.delete).toHaveBeenCalledTimes(1);
    });
  });
});
