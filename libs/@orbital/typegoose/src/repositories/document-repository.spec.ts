import { BulkItemizedResponse } from "@orbital/bulk-operations";
import { IdentifiableObject } from "@orbital/core";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "../utils/document-helpers";
import { DocumentRepository } from "./document-repository";

// Create a test domain class that extends IdentifiableObject
class TestDomainObject extends IdentifiableObject {
  public name: string;

  constructor(data: any = {}) {
    super(data);
    this.name = data.name || "";
  }
}

describe("DocumentRepository", () => {
  // Mock model implementation
  let mockModel: any;
  let repository: DocumentRepository<TestDomainObject>;

  // Mock document
  const mockDocument = {
    _id: "test-id-123",
    name: "Test Object",
    save: async () => true,
    toObject: () => ({
      _id: "test-id-123",
      name: "Test Object",
    }),
  };

  beforeEach(() => {
    // Create a mock model constructor function
    mockModel = jest.fn(() => mockDocument);

    // Add static methods to the mock model
    mockModel.find = jest.fn().mockReturnThis();
    mockModel.findById = jest.fn().mockReturnThis();
    mockModel.findOne = jest.fn().mockReturnThis();
    mockModel.deleteMany = jest.fn().mockReturnThis();
    mockModel.sort = jest.fn().mockReturnThis();
    mockModel.skip = jest.fn().mockReturnThis();
    mockModel.limit = jest.fn().mockReturnThis();
    mockModel.populate = jest.fn().mockReturnThis();
    mockModel.exec = jest.fn().mockResolvedValue([mockDocument]);

    // Mock the create method
    mockModel.create = jest.fn().mockResolvedValue(mockDocument);

    // Create repository with mock model
    repository = new DocumentRepository<TestDomainObject>(
      mockModel,
      TestDomainObject
    );

    // Spy on PersistenceMapper and DocumentHelpers
    jest.spyOn(PersistenceMapper, "toPersistence").mockReturnValue({
      _id: "test-id-123",
      name: "Test Object",
    });

    jest.spyOn(PersistenceMapper, "toDomain").mockReturnValue(
      new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      })
    );

    jest
      .spyOn(DocumentHelpers, "attachDocument")
      .mockImplementation(
        <T extends IdentifiableObject, S>(
          domainObject: T,
          document: MongooseDocument & S
        ) => {
          (domainObject as any).document = document;
          return domainObject as WithDocument<T, S>;
        }
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    it("should create a single entity", async () => {
      // Arrange
      const dto = {
        name: "Test Object",
      };

      // Act
      const result = await repository.create(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty("document");
      expect(PersistenceMapper.toPersistence).toHaveBeenCalled();
      expect(DocumentHelpers.attachDocument).toHaveBeenCalled();
    });

    it("should create multiple entities", async () => {
      // Arrange
      const dtos = [{ name: "Test Object 1" }, { name: "Test Object 2" }];

      // Act
      const result = await repository.create(dtos);

      // Assert
      expect(result).toBeInstanceOf(BulkItemizedResponse);
      expect(PersistenceMapper.toPersistence).toHaveBeenCalled();
      expect(DocumentHelpers.attachDocument).toHaveBeenCalled();
    });
  });

  describe("find", () => {
    it("should find entities matching filter criteria", async () => {
      // Arrange
      const filter = { name: "Test Object" };

      // Act
      const results = await repository.find(filter);

      // Assert
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(mockModel.find).toHaveBeenCalledWith(filter, undefined);
      expect(PersistenceMapper.toDomain).toHaveBeenCalled();
      expect(DocumentHelpers.attachDocument).toHaveBeenCalled();
    });

    it("should apply options to the query", async () => {
      // Arrange
      const filter = { name: "Test Object" };
      const options = {
        sort: { name: 1 },
        skip: 10,
        limit: 20,
        populate: "someField",
      };

      // Act
      await repository.find(filter, undefined, options);

      // Assert
      expect(mockModel.find).toHaveBeenCalledWith(filter, undefined);
      expect(mockModel.sort).toHaveBeenCalledWith(options.sort);
      expect(mockModel.skip).toHaveBeenCalledWith(options.skip);
      expect(mockModel.limit).toHaveBeenCalledWith(options.limit);
      expect(mockModel.populate).toHaveBeenCalledWith(options.populate);
    });
  });

  describe("findOne", () => {
    it("should find a single entity matching filter criteria", async () => {
      // Arrange
      const filter = { name: "Test Object" };

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toBeDefined();
      expect(mockModel.find).toHaveBeenCalledWith(filter, undefined);
      expect(mockModel.limit).toHaveBeenCalledWith(1);
    });

    it("should return null if no entity is found", async () => {
      // Arrange
      mockModel.exec.mockResolvedValueOnce([]);
      const filter = { name: "Nonexistent Object" };

      // Act
      const result = await repository.findOne(filter);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find an entity by ID", async () => {
      // Arrange
      const id = "test-id-123";

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(result).toBeDefined();
      expect(mockModel.find).toHaveBeenCalledWith({ _id: id }, undefined);
    });
  });

  describe("update", () => {
    beforeEach(() => {
      // Reset the mock implementation for each test
      mockModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument),
      });
    });

    it("should update a single entity", async () => {
      // Arrange
      const entity = new TestDomainObject({
        _id: "test-id-123",
        name: "Updated Test Object",
      });

      // Act
      const result = await repository.update(entity);

      // Assert
      expect(result).toBeDefined();
      expect(mockModel.findById).toHaveBeenCalledWith("test-id-123");
      expect(PersistenceMapper.toPersistence).toHaveBeenCalledWith(entity);
    });

    it("should return null if entity is not found", async () => {
      // Arrange
      // Mock BulkOperation.itemized to simulate a failed operation
      const mockBulkOperation = require("@orbital/bulk-operations");
      const originalItemized = mockBulkOperation.BulkOperation.itemized;

      // Create a mock implementation that returns a failed result
      mockBulkOperation.BulkOperation.itemized = jest
        .fn()
        .mockImplementation(<T, R>(items: T[], callback: any) => {
          // Create a mock response object with asSingle method
          const mockResponse = {
            asSingle: jest.fn().mockReturnValue(null),
          };
          return Promise.resolve(mockResponse);
        });

      // Reset the findById mock to return null
      mockModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const entity = new TestDomainObject({
        _id: "nonexistent-id",
        name: "Nonexistent Object",
      });

      try {
        // Act
        const result = await repository.update(entity);

        // Assert
        expect(result).toBeNull();
      } finally {
        // Restore the original implementation
        mockBulkOperation.BulkOperation.itemized = originalItemized;
      }
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      // Mock findById to return a document
      mockModel.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockDocument),
      }));

      // Mock deleteMany to return a result
      mockModel.deleteMany.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }));
    });

    it("should delete a single entity by ID", async () => {
      // Arrange
      const id = "test-id-123";

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(result).toBe(true);
      expect(mockModel.findById).toHaveBeenCalledWith(id);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({ _id: { $in: [id] } });
    });

    it("should return null if entity is not found", async () => {
      // Arrange
      mockModel.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      const id = "nonexistent-id";

      // Act
      const result = await repository.delete(id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("should save an entity with document attached", async () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      });

      const withDocument = DocumentHelpers.attachDocument(
        domainObject,
        mockDocument as unknown as MongooseDocument
      );

      // Act
      const result = await repository.save(withDocument);

      // Assert
      expect(result).toBe(withDocument);
      expect(PersistenceMapper.toPersistence).toHaveBeenCalledWith(
        withDocument
      );
    });

    it("should create a new document if none is attached", async () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      }) as WithDocument<TestDomainObject>;

      // Act
      const result = await repository.save(domainObject);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty("document");
      expect(PersistenceMapper.toPersistence).toHaveBeenCalledWith(
        domainObject
      );
    });
  });
});
