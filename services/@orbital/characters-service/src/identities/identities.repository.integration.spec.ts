import { Test, TestingModule } from "@nestjs/testing";
import { IdentityProviderEnum } from "@orbital/identity-types";
import { ReturnModelType } from "@typegoose/typegoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { TypegooseModule } from "nestjs-typegoose";
import { IdentitiesRepository } from "./identities.repository";

// Define the model name as a constant
const IDENTITY_ACCOUNT_MODEL_NAME = "IdentityAccount";

describe("IdentitiesRepository Integration", () => {
  // Define a more explicit type alias for the model
  type IdentityAccountModelType = ReturnModelType<any>;

  let repository: IdentitiesRepository;
  let mongod: MongoMemoryServer;
  let identityAccountModel: IdentityAccountModelType;
  let module: TestingModule;

  // Use a longer timeout for MongoDB setup
  jest.setTimeout(30000);

  beforeAll(async () => {
    try {
      // Create an in-memory MongoDB server
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      // Connect to the in-memory database
      await mongoose.connect(uri);

      // Set up the test module with TypegooseModule
      module = await Test.createTestingModule({
        imports: [
          TypegooseModule.forRoot(uri),
          // We'll provide the model manually instead of using TypegooseModule.forFeature
        ],
        providers: [
          {
            provide: "IdentityAccountModel",
            useValue: mongoose.model(
              IDENTITY_ACCOUNT_MODEL_NAME,
              new mongoose.Schema(
                {
                  _id: { type: String, auto: true },
                  characterId: { type: String, required: true },
                  provider: {
                    type: String,
                    required: true,
                    enum: Object.values(IdentityProviderEnum),
                  },
                  identifier: { type: String, required: true },
                  credentials: { type: [Object], default: [] },
                  createdAt: Date,
                  updatedAt: Date,
                },
                { timestamps: true }
              )
            ),
          },
          IdentitiesRepository,
        ],
      }).compile();

      // Get the repository and model
      repository = module.get<IdentitiesRepository>(IdentitiesRepository);
      identityAccountModel = module.get<IdentityAccountModelType>(
        "IdentityAccountModel"
      );
    } catch (error) {
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up resources - proper shutdown sequence
      if (module) {
        await module.close();
      }

      // Disconnect from mongoose before closing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Stop the in-memory server
      if (mongod) {
        await mongod.stop();
      }
    } catch (error) {
      throw error;
    }
  });

  beforeEach(async () => {
    // Clear only the identity accounts collection instead of dropping the entire database
    if (mongoose.connection.readyState === 1) {
      await identityAccountModel.deleteMany({});
    }
  });

  // Test inherited methods from DocumentRepository
  describe("create", () => {
    it("should create a new identity account", async () => {
      // Arrange
      const newIdentity = {
        _id: "new-created-identity",
        characterId: "test-character-id",
        provider: IdentityProviderEnum.EMAIL,
        identifier: "test@example.com",
        credentials: [],
      };

      // Act
      const result = await repository.create(newIdentity);

      // Assert
      expect(result).toBeDefined();

      // Type guard to check if result is an IdentityAccount
      if (result && typeof result === "object" && "_id" in result) {
        expect(result._id).toBeDefined();
        expect(result.characterId).toBe(newIdentity.characterId);
        expect(result.provider).toBe(newIdentity.provider);
        expect(result.identifier).toBe(newIdentity.identifier);
      } else {
        fail("Expected result to be an IdentityAccount");
      }

      // Verify it was actually saved to the database
      const savedIdentity = await identityAccountModel
        .findById(result._id)
        .exec();
      expect(savedIdentity).toBeDefined();
      expect(savedIdentity?.identifier).toBe(newIdentity.identifier);
    });
  });

  describe("find", () => {
    it("should find identity accounts with find method", async () => {
      // Arrange - Create test identity accounts
      const identities = await identityAccountModel.create([
        {
          _id: "identity-find-1",
          characterId: "character-1",
          provider: IdentityProviderEnum.EMAIL,
          identifier: "user1@example.com",
          credentials: [],
        },
        {
          _id: "identity-find-2",
          characterId: "character-2",
          provider: IdentityProviderEnum.GOOGLE,
          identifier: "user2@gmail.com",
          credentials: [],
        },
      ]);

      // Act - Use the find method which should be inherited from DocumentRepository
      const result = await repository.find({});

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it("should find identity accounts with specific options", async () => {
      // Arrange - Create test identity accounts
      await identityAccountModel.create([
        {
          _id: "identity-options-1",
          characterId: "character-options",
          provider: IdentityProviderEnum.EMAIL,
          identifier: "z-user@example.com",
          credentials: [],
        },
        {
          _id: "identity-options-2",
          characterId: "character-options",
          provider: IdentityProviderEnum.GOOGLE,
          identifier: "a-user@gmail.com",
          credentials: [],
        },
      ]);

      // Act - Use find with sort option
      const result = await repository.find(
        { characterId: "character-options" },
        undefined,
        { sort: { identifier: 1 } }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].identifier).toBe("a-user@gmail.com");
      expect(result[1].identifier).toBe("z-user@example.com");
    });
  });

  describe("findOne", () => {
    it("should find one identity account with findOne method", async () => {
      // Arrange - Create test identity accounts
      await identityAccountModel.create([
        {
          _id: "identity-findone-1",
          characterId: "character-findone",
          provider: IdentityProviderEnum.EMAIL,
          identifier: "findone-user1@example.com",
          credentials: [],
        },
        {
          _id: "identity-findone-2",
          characterId: "character-findone",
          provider: IdentityProviderEnum.GOOGLE,
          identifier: "findone-user2@gmail.com",
          credentials: [],
        },
      ]);

      // Act
      const result = await repository.findOne({
        characterId: "character-findone",
      });

      // Assert
      expect(result).toBeDefined();
      expect(result?.characterId).toBe("character-findone");
    });
  });

  describe("findById", () => {
    it("should find an identity account by id", async () => {
      // Arrange - Create identity account directly using the model
      const identity = await identityAccountModel.create({
        _id: "identity-find-by-id",
        characterId: "character-findbyid",
        provider: IdentityProviderEnum.GITHUB,
        identifier: "github-user",
        credentials: [],
      });

      // Act
      const result = await repository.findById(identity._id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.identifier).toBe("github-user");
    });
  });

  describe("update", () => {
    it("should update an existing identity account", async () => {
      // Arrange - Create an identity account to update
      const identity = await identityAccountModel.create({
        _id: "identity-to-update",
        characterId: "character-update",
        provider: IdentityProviderEnum.EMAIL,
        identifier: "original@example.com",
        credentials: [],
      });

      const updatedData = {
        _id: identity._id,
        characterId: "character-update",
        provider: IdentityProviderEnum.EMAIL,
        identifier: "updated@example.com",
        credentials: [],
      };

      // Act
      const result = await repository.update(updatedData);

      // Assert
      expect(result).toBeDefined();

      // Type guard to check if result is an IdentityAccount
      if (result && typeof result === "object" && "_id" in result) {
        expect(result._id).toBe(updatedData._id);
        expect(result.identifier).toBe(updatedData.identifier);
      } else if (result !== null) {
        fail("Expected result to be an IdentityAccount or null");
      }

      // Verify it was actually updated in the database
      const updatedIdentity = await identityAccountModel
        .findById(identity._id)
        .exec();
      expect(updatedIdentity?.identifier).toBe(updatedData.identifier);
    });

    it("should return null when updating a non-existent identity account", async () => {
      // Arrange
      const nonExistentIdentity = {
        _id: "non-existent-identity",
        characterId: "character-nonexistent",
        provider: IdentityProviderEnum.EMAIL,
        identifier: "nonexistent@example.com",
        credentials: [],
      };

      // Act
      const result = await repository.update(nonExistentIdentity);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an existing identity account", async () => {
      // Arrange - Create an identity account to delete
      const identity = await identityAccountModel.create({
        _id: "identity-to-delete",
        characterId: "character-delete",
        provider: IdentityProviderEnum.EMAIL,
        identifier: "delete-me@example.com",
        credentials: [],
      });

      // Act
      const result = await repository.delete(identity._id);

      // Assert
      expect(result).toBe(true);

      // Verify it was actually deleted from the database
      const deletedIdentity = await identityAccountModel
        .findById(identity._id)
        .exec();
      expect(deletedIdentity).toBeNull();
    });

    it("should return null when deleting a non-existent identity account", async () => {
      // Act
      const result = await repository.delete("non-existent-identity");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("findByCharacterId", () => {
    it("should find identity accounts by characterId", async () => {
      // Arrange - Create test identity accounts
      const characterId = "test-character-id";
      const otherCharacterId = "other-character-id";

      // Create identity accounts directly using the model
      await identityAccountModel.create([
        {
          _id: "identity-1",
          characterId,
          provider: IdentityProviderEnum.EMAIL,
          identifier: "user1@example.com",
          credentials: [],
        },
        {
          _id: "identity-2",
          characterId,
          provider: IdentityProviderEnum.GOOGLE,
          identifier: "user2@gmail.com",
          credentials: [],
        },
        {
          _id: "identity-3",
          characterId: otherCharacterId,
          provider: IdentityProviderEnum.GITHUB,
          identifier: "github-user",
          credentials: [],
        },
      ]);

      // Act - Find identity accounts by characterId
      const result = await repository.findByCharacterId(characterId);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].characterId).toBe(characterId);
      expect(result[1].characterId).toBe(characterId);
    });

    it("should return empty array when no identity accounts found", async () => {
      // Arrange - No identity accounts in the database

      // Act
      const result = await repository.findByCharacterId(
        "nonexistent-character-id"
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should apply projection when provided", async () => {
      // Arrange - Create a test identity account
      const characterId = "test-character-id";

      // Create identity account directly using the model
      await identityAccountModel.create({
        _id: "identity-projection",
        characterId,
        provider: IdentityProviderEnum.EMAIL,
        identifier: "projection@example.com",
        credentials: [],
      });

      // Act - Find identity account with projection
      const result = await repository.findByCharacterId(characterId, {
        identifier: 1,
        provider: 1,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].identifier).toBe("projection@example.com");
      expect(result[0].provider).toBe(IdentityProviderEnum.EMAIL);
      // characterId should be included since it's required
      expect(result[0].characterId).toBe(characterId);
    });

    it("should apply options when provided", async () => {
      // Arrange - Create test identity accounts
      const characterId = "test-character-id";

      // Create identity accounts directly using the model
      await identityAccountModel.create([
        {
          _id: "identity-b",
          characterId,
          provider: IdentityProviderEnum.EMAIL,
          identifier: "b-user@example.com",
          credentials: [],
        },
        {
          _id: "identity-a",
          characterId,
          provider: IdentityProviderEnum.GOOGLE,
          identifier: "a-user@gmail.com",
          credentials: [],
        },
      ]);

      // Act - Find identity accounts with sort option
      const result = await repository.findByCharacterId(
        characterId,
        undefined,
        {
          sort: { identifier: 1 },
        }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].identifier).toBe("a-user@gmail.com");
      expect(result[1].identifier).toBe("b-user@example.com");
    });
  });
});
