import { CrudService } from "../services/crud.service";
import { CrudController } from "./crud.controller";

// Define a test entity type
type TestEntity = {
  _id?: string;
  name: string;
  description?: string;
  count: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

// Create a concrete implementation of CrudService for testing
class TestService extends CrudService<TestEntity, any> {
  constructor() {
    super(null as any); // We'll mock all methods, so we don't need actual params
  }
}

// Create a concrete implementation of CrudController for testing
class TestController extends CrudController<TestEntity, TestService> {
  constructor(service: TestService) {
    super(service, "TestEntity");
  }
}

describe("CrudController", () => {
  let controller: TestController;
  let serviceMock: jest.Mocked<TestService>;

  // Mock entity data
  const mockEntity: TestEntity = {
    _id: "test-id-123",
    name: "Test Entity",
    description: "Test Description",
    count: 42,
    tags: ["tag1", "tag2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Create a mock for the service
    serviceMock = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TestService>;

    // Create controller instance with mock service
    controller = new TestController(serviceMock);
  });

  describe("create", () => {
    it("should call service.create with the provided dto", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        description: "New Description",
        count: 10,
      };

      serviceMock.create.mockResolvedValue(mockEntity);

      const result = await controller.create(createDto);

      expect(serviceMock.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockEntity);
    });
  });

  describe("findById", () => {
    it("should call service.findById with the provided id", async () => {
      serviceMock.findById.mockResolvedValue(mockEntity);

      const result = await controller.findById(mockEntity._id!);

      expect(serviceMock.findById).toHaveBeenCalledWith(mockEntity._id);
      expect(result).toEqual(mockEntity);
    });

    it("should return null if entity not found", async () => {
      serviceMock.findById.mockResolvedValue(null);

      const result = await controller.findById("nonexistent-id");

      expect(serviceMock.findById).toHaveBeenCalledWith("nonexistent-id");
      expect(result).toBeNull();
    });
  });

  describe("find", () => {
    it("should call service.find with the provided filter, projection, and options", async () => {
      const filter = { name: "Test" };
      const projection = { name: 1, count: 1 };
      const options = { sort: { createdAt: -1 } };
      const entities = [mockEntity];

      serviceMock.find.mockResolvedValue(entities);

      const result = await controller.find(filter, projection, options);

      expect(serviceMock.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toEqual(entities);
    });

    it("should use empty filter if none provided", async () => {
      const entities = [mockEntity];

      serviceMock.find.mockResolvedValue(entities);

      const result = await controller.find();

      expect(serviceMock.find).toHaveBeenCalledWith({}, undefined, undefined);
      expect(result).toEqual(entities);
    });
  });

  describe("update", () => {
    it("should call service.update with the provided entity", async () => {
      const updateData = {
        _id: mockEntity._id!,
        name: "Updated Entity",
        description: "Updated Description",
      };

      serviceMock.update.mockResolvedValue(mockEntity);

      const result = await controller.update(updateData);

      expect(serviceMock.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockEntity);
    });

    it("should return null if entity not found", async () => {
      const updateData = {
        _id: "nonexistent-id",
        name: "Updated Entity",
      };

      serviceMock.update.mockResolvedValue(null);

      const result = await controller.update(updateData);

      expect(serviceMock.update).toHaveBeenCalledWith(updateData);
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should call service.delete with the provided id", async () => {
      serviceMock.delete.mockResolvedValue(true);

      const result = await controller.delete(mockEntity._id!);

      expect(serviceMock.delete).toHaveBeenCalledWith(mockEntity._id);
      expect(result).toBe(true);
    });

    it("should return null if entity not found", async () => {
      serviceMock.delete.mockResolvedValue(null);

      const result = await controller.delete("nonexistent-id");

      expect(serviceMock.delete).toHaveBeenCalledWith("nonexistent-id");
      expect(result).toBeNull();
    });
  });
});
