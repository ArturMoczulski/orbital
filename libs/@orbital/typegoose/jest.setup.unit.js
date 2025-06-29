// Jest setup for unit tests
// Add unit-test-specific configuration or global mocks here

// Mock mongoose and typegoose for unit tests
jest.mock("mongoose", () => {
  const originalModule = jest.requireActual("mongoose");

  // Create a mock Document class
  class MockDocument {
    constructor(data) {
      Object.assign(this, data);
    }

    save() {
      return Promise.resolve(this);
    }
  }

  // Create a mock Model class
  class MockModel {
    constructor(data) {
      this.data = data;
    }

    static create(data) {
      return Promise.resolve(new MockDocument(data));
    }

    static find() {
      return {
        exec: () => Promise.resolve([new MockDocument({ _id: "mock-id" })]),
      };
    }

    static findOne() {
      return {
        exec: () => Promise.resolve(new MockDocument({ _id: "mock-id" })),
      };
    }

    static findById(id) {
      return {
        exec: () => Promise.resolve(new MockDocument({ _id: id })),
      };
    }

    static updateOne() {
      return {
        exec: () => Promise.resolve({ modifiedCount: 1 }),
      };
    }

    static deleteOne() {
      return {
        exec: () => Promise.resolve({ deletedCount: 1 }),
      };
    }
  }

  return {
    ...originalModule,
    Model: MockModel,
    Document: MockDocument,
  };
});

// Add any other unit-test-specific mocks or setup
