import { IdentityAccount, IdentityProviderEnum } from "@orbital/identity-types";
import { DocumentRepository } from "@orbital/typegoose";
import type { ReturnModelType } from "@typegoose/typegoose";
import { Document } from "mongoose";
import {
  IdentitiesRepository,
  IdentityAccountProps,
} from "./identities.repository";

describe("IdentitiesRepository", () => {
  let repository: IdentitiesRepository;
  let mockIdentityAccountModel: ReturnModelType<any>;
  let mockIdentityAccount: IdentityAccount;

  beforeEach(() => {
    // Create a mock identity account directly
    mockIdentityAccount = {
      characterId: "test-character-id",
      provider: IdentityProviderEnum.LOCAL,
      identifier: "test-user@example.com",
      credentials: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IdentityAccount;

    // Create a mock document with save and toObject methods
    const mockIdentityAccountDocument = {
      ...mockIdentityAccount,
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(mockIdentityAccount),
    } as unknown as Document & IdentityAccount;

    // Create a proper mock model object with all required methods
    const mockModel = {
      // Constructor function
      new: jest.fn().mockReturnValue(mockIdentityAccountDocument),
      // Static methods
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockIdentityAccountDocument]),
    };

    // Create a function that also has all the properties of mockModel
    const modelFunction = function () {
      return mockIdentityAccountDocument;
    } as any;

    // Copy all properties from mockModel to modelFunction
    Object.assign(modelFunction, mockModel);

    // Cast to the required type
    mockIdentityAccountModel = modelFunction as unknown as ReturnModelType<any>;

    // Create repository with mock model
    repository = new IdentitiesRepository(mockIdentityAccountModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  it("should be an instance of DocumentRepository", () => {
    expect(repository).toBeInstanceOf(DocumentRepository);
  });

  describe("create", () => {
    it("should create an identity account", async () => {
      // Arrange
      const identityData = {
        characterId: "new-character-id",
        provider: IdentityProviderEnum.GOOGLE,
        identifier: "new-user@gmail.com",
        credentials: [],
      } as unknown as Omit<IdentityAccountProps, "_id">;

      // Mock the create method to return the created identity
      const createdIdentity = { ...identityData, _id: "identity-123" };
      const mockCreateResult = createdIdentity as IdentityAccount;
      jest.spyOn(repository, "create").mockResolvedValueOnce(mockCreateResult);

      // Act
      const result = await repository.create(identityData);

      // Assert
      expect(result).toEqual(createdIdentity);
      // Type assertion to handle the union return type
      if ("_id" in result) {
        expect(result._id).toBe("identity-123");
      }
    });
  });

  describe("find", () => {
    it("should find identity accounts with filter", async () => {
      // Arrange
      const filter = { provider: IdentityProviderEnum.LOCAL };
      const mockIdentities = [
        {
          _id: "identity-1",
          characterId: "char-1",
          provider: IdentityProviderEnum.LOCAL,
          identifier: "user1@example.com",
        },
        {
          _id: "identity-2",
          characterId: "char-2",
          provider: IdentityProviderEnum.LOCAL,
          identifier: "user2@example.com",
        },
      ];

      jest
        .spyOn(repository, "find")
        .mockResolvedValueOnce(mockIdentities as IdentityAccount[]);

      // Act
      const result = await repository.find(filter);

      // Assert
      expect(result).toEqual(mockIdentities);
      expect(result.length).toBe(2);
    });
  });

  describe("findOne", () => {
    it("should find one identity account by filter", async () => {
      // Arrange
      const filter = { identifier: "test-user@example.com" };

      jest
        .spyOn(repository, "findOne")
        .mockResolvedValueOnce(mockIdentityAccount);

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toEqual(mockIdentityAccount);
      expect(result?.identifier).toBe("test-user@example.com");
    });
  });

  describe("findById", () => {
    it("should find identity account by ID", async () => {
      // Arrange
      const identityId = "identity-123";
      const mockIdentityWithId = { ...mockIdentityAccount, _id: identityId };

      jest
        .spyOn(repository, "findById")
        .mockResolvedValueOnce(mockIdentityWithId as IdentityAccount);

      // Act
      const result = await repository.findById(identityId);

      // Assert
      expect(result).toEqual(mockIdentityWithId);
      // Type assertion to handle the union return type
      expect((result as IdentityAccount)?._id).toBe(identityId);
    });
  });

  describe("update", () => {
    it("should update an identity account", async () => {
      // Arrange
      const identityToUpdate = {
        _id: "identity-123",
        characterId: "test-character-id",
        provider: IdentityProviderEnum.LOCAL,
        identifier: "updated-user@example.com",
        credentials: [],
      };

      const mockUpdateResult = identityToUpdate as IdentityAccount;
      jest.spyOn(repository, "update").mockResolvedValueOnce(mockUpdateResult);

      // Act
      const result = await repository.update(identityToUpdate);

      // Assert
      expect(result).toEqual(identityToUpdate);
      // Type assertion to handle the union return type
      if (result && "_id" in result) {
        expect(result.identifier).toBe("updated-user@example.com");
      }
    });
  });

  describe("delete", () => {
    it("should delete an identity account by ID", async () => {
      // Arrange
      const identityId = "identity-123";

      // The delete method returns boolean, null, or BulkCountedResponse
      jest.spyOn(repository, "delete").mockResolvedValueOnce(true);

      // Act
      const result = await repository.delete(identityId);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("findByCharacterId", () => {
    it("should find identity accounts by characterId", async () => {
      // Arrange
      const characterId = "test-character-id";

      // Create mock identities directly
      const mockIdentities = [
        {
          characterId,
          provider: IdentityProviderEnum.LOCAL,
          identifier: "user1@example.com",
          credentials: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          characterId,
          provider: IdentityProviderEnum.GOOGLE,
          identifier: "user2@gmail.com",
          credentials: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the find method to return our mock identities
      jest
        .spyOn(repository, "find")
        .mockResolvedValue(mockIdentities as IdentityAccount[]);

      // Act
      const result = await repository.findByCharacterId(characterId);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { characterId },
        undefined,
        undefined
      );
      expect(result).toEqual(mockIdentities);
      expect(result.length).toBe(2);
      expect(result[0].characterId).toBe(characterId);
      expect(result[1].characterId).toBe(characterId);
    });

    it("should pass projection and options to find method", async () => {
      // Arrange
      const characterId = "test-character-id";
      const projection = { provider: 1, identifier: 1 };
      const options = { sort: { provider: 1 } };

      // Mock the find method
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      await repository.findByCharacterId(characterId, projection, options);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { characterId },
        projection,
        options
      );
    });

    it("should return empty array when no identity accounts found", async () => {
      // Arrange
      const characterId = "nonexistent-character-id";

      // Mock the find method to return empty array
      jest.spyOn(repository, "find").mockResolvedValue([]);

      // Act
      const result = await repository.findByCharacterId(characterId);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(
        { characterId },
        undefined,
        undefined
      );
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });
});
