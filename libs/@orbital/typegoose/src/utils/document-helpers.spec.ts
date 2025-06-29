import { IdentifiableObject } from "@orbital/core";
import { PersistenceMapper } from "../mappers/persistence-mapper";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "./document-helpers";

// Create a test domain class that extends IdentifiableObject
class TestDomainObject extends IdentifiableObject {
  public name: string;

  constructor(data: any = {}) {
    super(data);
    this.name = data.name || "";
  }
}

describe("DocumentHelpers", () => {
  // Mock document
  const mockDocument = {
    _id: "test-id-123",
    name: "Test Object",
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockImplementation(function (this: any, path: string) {
      return Promise.resolve(this);
    }),
    remove: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({
      _id: "test-id-123",
      name: "Test Object",
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(PersistenceMapper, "toPersistence").mockReturnValue({
      _id: "test-id-123",
      name: "Test Object",
    });
  });

  describe("attachDocument", () => {
    it("should attach a document to a domain object", () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      });

      // Act
      const result = DocumentHelpers.attachDocument(
        domainObject,
        mockDocument as unknown as MongooseDocument
      );

      // Assert
      expect(result).toBe(domainObject);
      expect(result.document).toBe(mockDocument);
    });
  });

  describe("save", () => {
    it("should save the document attached to a domain object", async () => {
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
      const result = await DocumentHelpers.save(withDocument);

      // Assert
      expect(result).toBe(withDocument);
      expect(mockDocument.save).toHaveBeenCalled();
      expect(PersistenceMapper.toPersistence).toHaveBeenCalledWith(
        withDocument
      );
    });

    it("should throw an error if no document is attached", async () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      }) as WithDocument<TestDomainObject>;

      // Act & Assert
      await expect(DocumentHelpers.save(domainObject)).rejects.toThrow(
        "No document attached to this domain object"
      );
    });
  });

  describe("populate", () => {
    it("should populate a reference field in the document", async () => {
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
      const result = await DocumentHelpers.populate(withDocument, "someField");

      // Assert
      expect(result).toBe(withDocument);
      expect(mockDocument.populate).toHaveBeenCalledWith("someField");
    });

    it("should throw an error if no document is attached", async () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      }) as WithDocument<TestDomainObject>;

      // Act & Assert
      await expect(
        DocumentHelpers.populate(domainObject, "someField")
      ).rejects.toThrow("No document attached to this domain object");
    });
  });

  describe("remove", () => {
    it("should remove the document from the database", async () => {
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
      await DocumentHelpers.remove(withDocument);

      // Assert
      expect(mockDocument.remove).toHaveBeenCalled();
    });

    it("should throw an error if no document is attached", async () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      }) as WithDocument<TestDomainObject>;

      // Act & Assert
      await expect(DocumentHelpers.remove(domainObject)).rejects.toThrow(
        "No document attached to this domain object"
      );
    });
  });

  describe("hasDocument", () => {
    it("should return true if a document is attached", () => {
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
      const result = DocumentHelpers.hasDocument(withDocument);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false if no document is attached", () => {
      // Arrange
      const domainObject = new TestDomainObject({
        _id: "test-id-123",
        name: "Test Object",
      }) as WithDocument<TestDomainObject>;

      // Act
      const result = DocumentHelpers.hasDocument(domainObject);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("createWithDocument", () => {
    it("should create a new domain object with document attached", () => {
      // Arrange
      const constructorArg = { _id: "test-id-123", name: "Test Object" };

      // Act
      const result = DocumentHelpers.createWithDocument(
        TestDomainObject,
        mockDocument as unknown as MongooseDocument,
        [constructorArg]
      );

      // Assert
      expect(result).toBeInstanceOf(TestDomainObject);
      expect(result.document).toBe(mockDocument);
      expect(result._id).toBe("test-id-123");
      expect(result.name).toBe("Test Object");
    });
  });
});
