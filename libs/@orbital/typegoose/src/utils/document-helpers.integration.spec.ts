import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { MongooseDocument, WithDocument } from "../types/with-document";
import { DocumentHelpers } from "./document-helpers";

// Define a test domain class
class TestEntity extends IdentifiableObject {
  name: string;
  description?: string;
  tags: string[];

  constructor(data: any) {
    super(data);
    this.name = data.name || "";
    this.description = data.description;
    this.tags = data.tags || [];
  }
}

// Define a test schema for MongoDB
const TestEntitySchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

describe("DocumentHelpers Integration Tests", () => {
  let TestEntityModel: any; // Using any to bypass mongoose type issues

  beforeAll(async () => {
    // Create the model
    TestEntityModel = mongoose.model("TestEntityHelpers", TestEntitySchema);
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await TestEntityModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up model to prevent OverwriteModelError in subsequent test runs
    if (
      mongoose.connection &&
      mongoose.connection.models &&
      mongoose.connection.models["TestEntityHelpers"]
    ) {
      delete mongoose.connection.models["TestEntityHelpers"];
    }
  });

  describe("attachDocument", () => {
    it("should attach a document to a domain object", async () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "attach-test-id",
        name: "Attach Test",
        tags: ["attach", "test"],
      });

      const doc = new TestEntityModel({
        _id: "attach-test-id",
        name: "Attach Test",
        tags: ["attach", "test"],
      });

      // Act
      const result = DocumentHelpers.attachDocument(
        domainObject,
        doc as MongooseDocument
      );

      // Assert
      expect(result).toBe(domainObject); // Should return the same object
      expect(result.document).toBeDefined();
      expect(result.document).toBe(doc);
    });
  });

  describe("save", () => {
    it("should save the document attached to a domain object", async () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "save-test-id",
        name: "Save Test",
        tags: ["save", "test"],
      });

      const doc = new TestEntityModel({
        _id: "save-test-id",
        name: "Save Test",
        tags: ["save", "test"],
      });

      const withDoc = DocumentHelpers.attachDocument(
        domainObject,
        doc as MongooseDocument
      );

      // Modify the domain object
      withDoc.name = "Updated Save Test";
      withDoc.tags = ["save", "test", "updated"];

      // Act
      const result = await DocumentHelpers.save(withDoc);

      // Assert
      expect(result).toBe(withDoc); // Should return the same object

      // Verify it was saved to the database
      const savedDoc = await TestEntityModel.findById("save-test-id").lean();
      expect(savedDoc).toBeDefined();
      expect(savedDoc.name).toBe("Updated Save Test");
      expect(savedDoc.tags).toEqual(["save", "test", "updated"]);
    });

    it("should throw an error if no document is attached", async () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "no-doc-id",
        name: "No Document",
        tags: ["no", "document"],
      });

      // Act & Assert
      await expect(
        DocumentHelpers.save(domainObject as WithDocument<TestEntity>)
      ).rejects.toThrow("No document attached to this domain object");
    });
  });

  describe("populate", () => {
    it("should populate a reference field in the document", async () => {
      // This test requires a more complex setup with references between collections
      // For simplicity, we'll just test that the method calls document.populate

      // Arrange
      const domainObject = new TestEntity({
        _id: "populate-test-id",
        name: "Populate Test",
        tags: ["populate", "test"],
      });

      const doc = new TestEntityModel({
        _id: "populate-test-id",
        name: "Populate Test",
        tags: ["populate", "test"],
      });

      // Mock the populate method
      doc.populate = jest.fn().mockResolvedValue(doc);

      const withDoc = DocumentHelpers.attachDocument(
        domainObject,
        doc as MongooseDocument
      );

      // Act
      const result = await DocumentHelpers.populate(withDoc, "someReference");

      // Assert
      expect(result).toBe(withDoc);
      expect(doc.populate).toHaveBeenCalledWith("someReference");
    });

    it("should throw an error if no document is attached", async () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "no-doc-populate-id",
        name: "No Document Populate",
        tags: ["no", "document", "populate"],
      });

      // Act & Assert
      await expect(
        DocumentHelpers.populate(
          domainObject as WithDocument<TestEntity>,
          "someReference"
        )
      ).rejects.toThrow("No document attached to this domain object");
    });
  });

  describe("remove", () => {
    it("should remove the document from the database", async () => {
      // Arrange
      const testData = {
        _id: "remove-test-id",
        name: "Remove Test",
        tags: ["remove", "test"],
      };

      // Create a document in the database
      const doc = await TestEntityModel.create(testData);

      const domainObject = new TestEntity(testData);
      const withDoc = DocumentHelpers.attachDocument(
        domainObject,
        doc as MongooseDocument
      );

      // Verify it exists in the database
      const existingDoc = await TestEntityModel.findById("remove-test-id");
      expect(existingDoc).toBeDefined();

      // Act
      await DocumentHelpers.remove(withDoc);

      // Assert
      const removedDoc = await TestEntityModel.findById("remove-test-id");
      expect(removedDoc).toBeNull();
    });

    it("should throw an error if no document is attached", async () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "no-doc-remove-id",
        name: "No Document Remove",
        tags: ["no", "document", "remove"],
      });

      // Act & Assert
      await expect(
        DocumentHelpers.remove(domainObject as WithDocument<TestEntity>)
      ).rejects.toThrow("No document attached to this domain object");
    });
  });

  describe("hasDocument", () => {
    it("should return true if a document is attached", () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "has-doc-id",
        name: "Has Document",
        tags: ["has", "document"],
      });

      const doc = new TestEntityModel({
        _id: "has-doc-id",
        name: "Has Document",
        tags: ["has", "document"],
      });

      const withDoc = DocumentHelpers.attachDocument(
        domainObject,
        doc as MongooseDocument
      );

      // Act
      const result = DocumentHelpers.hasDocument(withDoc);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false if no document is attached", () => {
      // Arrange
      const domainObject = new TestEntity({
        _id: "no-doc-check-id",
        name: "No Document Check",
        tags: ["no", "document", "check"],
      });

      // Act
      const result = DocumentHelpers.hasDocument(
        domainObject as WithDocument<TestEntity>
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("createWithDocument", () => {
    it("should create a new domain object with document attached", () => {
      // Arrange
      const doc = new TestEntityModel({
        _id: "create-with-doc-id",
        name: "Create With Document",
        tags: ["create", "with", "document"],
      });

      // Act
      const result = DocumentHelpers.createWithDocument(
        TestEntity,
        doc as MongooseDocument,
        [
          {
            _id: "create-with-doc-id",
            name: "Create With Document",
            tags: ["create", "with", "document"],
          },
        ]
      );

      // Assert
      expect(result).toBeInstanceOf(TestEntity);
      expect(result._id).toBe("create-with-doc-id");
      expect(result.name).toBe("Create With Document");
      expect(result.tags).toEqual(["create", "with", "document"]);
      expect(result.document).toBe(doc);
    });
  });
});
