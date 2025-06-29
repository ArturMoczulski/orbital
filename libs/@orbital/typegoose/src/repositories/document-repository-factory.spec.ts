import { IdentifiableObject } from "@orbital/core";
import * as z from "zod";
import { ZodObject } from "zod";
import { DocumentRepository } from "./document-repository";
import { DocumentRepositoryFactory } from "./document-repository-factory";

// Create a mock version of DocumentRepository for testing
const originalDocumentRepository = DocumentRepository;
let mockDocumentRepositoryInstance: any;
let lastModelParam: any;
let lastDomainClassParam: any;
let lastSchemaParam: any;

// Mock the DocumentRepository class
class MockDocumentRepository {
  constructor(model: any, DomainClass: any, schema?: ZodObject<any>) {
    lastModelParam = model;
    lastDomainClassParam = DomainClass;
    lastSchemaParam = schema;
    mockDocumentRepositoryInstance = this;
  }
}

describe("DocumentRepositoryFactory", () => {
  // Save original and replace with mock before tests
  let originalRepository: any;

  beforeEach(() => {
    originalRepository = DocumentRepository as any;
    (DocumentRepository as any) = MockDocumentRepository;

    // Reset tracking variables
    mockDocumentRepositoryInstance = null;
    lastModelParam = null;
    lastDomainClassParam = null;
    lastSchemaParam = null;
  });

  // Restore original after tests
  afterEach(() => {
    (DocumentRepository as any) = originalRepository;
  });

  describe("create", () => {
    it("should create a new DocumentRepository with the provided model and domain class", () => {
      // Arrange
      const mockModel = { name: "MockModel" };

      class TestObject extends IdentifiableObject {
        constructor(data: any) {
          super(data);
        }
      }

      // Act
      const repository = DocumentRepositoryFactory.create(
        mockModel,
        TestObject
      );

      // Assert
      expect(lastModelParam).toBe(mockModel);
      expect(lastDomainClassParam).toBe(TestObject);
    });

    it("should return the created repository instance", () => {
      // Arrange
      const mockModel = { name: "AnotherMockModel" };

      class AnotherTestObject extends IdentifiableObject {
        constructor(data: any) {
          super(data);
        }
      }

      // Act
      const repository = DocumentRepositoryFactory.create(
        mockModel,
        AnotherTestObject
      );

      // Assert
      expect(repository).toBe(mockDocumentRepositoryInstance);
    });

    it("should create a new DocumentRepository with the provided model, domain class, and schema", () => {
      // Arrange
      const mockModel = { name: "SchemaModel" };
      const testSchema = z.object({
        _id: z.string(),
        name: z.string(),
        description: z.string().optional(),
      });

      class SchemaTestObject extends IdentifiableObject {
        constructor(data: any) {
          super(data);
        }
      }

      // Act
      const repository = DocumentRepositoryFactory.create(
        mockModel,
        SchemaTestObject,
        testSchema
      );

      // Assert
      expect(lastModelParam).toBe(mockModel);
      expect(lastDomainClassParam).toBe(SchemaTestObject);
      expect(lastSchemaParam).toBe(testSchema);
    });
  });
});
