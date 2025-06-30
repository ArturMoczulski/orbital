import { IdentifiableObject } from "@orbital/core";
import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import "reflect-metadata";
import {
  getReferences,
  Reference,
  ReferenceMetadata,
} from "./reference.decorator";

// Define a test parent entity class
class TestParentEntity extends IdentifiableObject {
  name: string;

  constructor(data: any) {
    super(data);
    this.name = data.name || "";
  }

  toPlainObject(): Record<string, any> {
    return {
      _id: this._id,
      name: this.name,
    };
  }

  validateSchema(): this {
    return this;
  }

  validate(): this {
    return this;
  }
}

// Define a test child entity class with a reference to the parent
class TestChildEntity extends IdentifiableObject {
  name: string;

  @Reference({ collection: "TestParentEntity" })
  parentId!: string;

  constructor(data: any) {
    super(data);
    this.name = data.name || "";
    this.parentId = data.parentId;
  }

  toPlainObject(): Record<string, any> {
    return {
      _id: this._id,
      name: this.name,
      parentId: this.parentId,
    };
  }

  validateSchema(): this {
    return this;
  }

  validate(): this {
    return this;
  }
}

// Define MongoDB schemas
const TestParentEntitySchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TestChildEntitySchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  parentId: { type: String, required: true, ref: "TestParentEntity" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

describe("Reference Decorator Integration Tests", () => {
  let TestParentEntityModel: any; // Using any to bypass mongoose type issues
  let TestChildEntityModel: any; // Using any to bypass mongoose type issues

  beforeAll(async () => {
    // Create the models
    TestParentEntityModel = mongoose.model(
      "TestParentEntity",
      TestParentEntitySchema
    );
    TestChildEntityModel = mongoose.model(
      "TestChildEntity",
      TestChildEntitySchema
    );
  });

  afterEach(async () => {
    // Clear the collections after each test
    await TestParentEntityModel.deleteMany({});
    await TestChildEntityModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up models to prevent OverwriteModelError in subsequent test runs
    if (
      mongoose.connection &&
      mongoose.connection.models &&
      mongoose.connection.models["TestParentEntity"]
    ) {
      delete mongoose.connection.models["TestParentEntity"];
    }
    if (
      mongoose.connection &&
      mongoose.connection.models &&
      mongoose.connection.models["TestChildEntity"]
    ) {
      delete mongoose.connection.models["TestChildEntity"];
    }
  });

  it("should correctly apply reference metadata to the class", () => {
    // Act
    const references = getReferences(TestChildEntity);

    // Assert
    expect(references).toBeDefined();
    expect(references).toBeInstanceOf(Array);
    expect(references.length).toBe(1);

    const reference = references[0] as ReferenceMetadata;
    expect(reference.propertyKey).toBe("parentId");
    expect(reference.collection).toBe("TestParentEntity");
    expect(reference.required).toBe(true);
    expect(reference.foreignField).toBe("_id");
  });

  it("should be able to create entities with valid references", async () => {
    // Arrange
    const parentEntity = new TestParentEntity({
      _id: "parent-123",
      name: "Parent Entity",
    });

    // Create the parent entity in the database
    await TestParentEntityModel.create(parentEntity.toPlainObject());

    const childEntity = new TestChildEntity({
      _id: "child-123",
      name: "Child Entity",
      parentId: "parent-123",
    });

    // Act
    const result = await TestChildEntityModel.create(
      childEntity.toPlainObject()
    );

    // Assert
    expect(result).toBeDefined();
    expect(result._id).toBe("child-123");
    expect(result.parentId).toBe("parent-123");

    // Verify it was saved to the database
    const savedDoc = await TestChildEntityModel.findById("child-123").lean();
    expect(savedDoc).toBeDefined();
    expect(savedDoc.name).toBe("Child Entity");
    expect(savedDoc.parentId).toBe("parent-123");
  });

  it("should be able to find child entities by parent ID", async () => {
    // Arrange
    const parentEntity = new TestParentEntity({
      _id: "parent-456",
      name: "Parent Entity",
    });

    await TestParentEntityModel.create(parentEntity.toPlainObject());

    const childEntities = [
      new TestChildEntity({
        _id: "child-1",
        name: "Child 1",
        parentId: "parent-456",
      }),
      new TestChildEntity({
        _id: "child-2",
        name: "Child 2",
        parentId: "parent-456",
      }),
      new TestChildEntity({
        _id: "child-3",
        name: "Child 3",
        parentId: "different-parent",
      }),
    ];

    await TestChildEntityModel.create(
      childEntities.map((entity) => entity.toPlainObject())
    );

    // Act
    const results = await TestChildEntityModel.find({
      parentId: "parent-456",
    }).lean();

    // Assert
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results.map((r: any) => r._id)).toContain("child-1");
    expect(results.map((r: any) => r._id)).toContain("child-2");
    expect(results.map((r: any) => r._id)).not.toContain("child-3");
  });

  it("should be able to populate parent entity from child entity", async () => {
    // Arrange
    const parentEntity = new TestParentEntity({
      _id: "parent-789",
      name: "Parent Entity for Population",
    });

    await TestParentEntityModel.create(parentEntity.toPlainObject());

    const childEntity = new TestChildEntity({
      _id: "child-for-population",
      name: "Child for Population",
      parentId: "parent-789",
    });

    await TestChildEntityModel.create(childEntity.toPlainObject());

    // Act
    const result = await TestChildEntityModel.findById("child-for-population")
      .populate("parentId")
      .lean();

    // Assert
    expect(result).toBeDefined();
    expect(result.parentId).toBeDefined();
    expect(result.parentId._id).toBe("parent-789");
    expect(result.parentId.name).toBe("Parent Entity for Population");
  });
});
