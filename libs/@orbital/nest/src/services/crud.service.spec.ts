import { CrudRepository } from "../repositories/crud.repository";
import { CrudService } from "./crud.service";

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

// Create a concrete implementation of CrudRepository for testing
class TestRepository extends CrudRepository<TestEntity> {
  constructor() {
    super(null as any, null as any); // We'll mock all methods, so we don't need actual params
  }
}

// Create a concrete implementation of CrudService for testing
class TestService extends CrudService<TestEntity, TestRepository> {
  constructor(repository: TestRepository) {
    super(repository);
  }
}

describe("CrudService", () => {
  let service: TestService;
  let repositoryMock: jest.Mocked<TestRepository>;

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
    // Create a mock for the repository
    repositoryMock = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TestRepository>;

    // Create service instance with mock repository
    service = new TestService(repositoryMock);
  });

  describe("create", () => {
    it("should call repository.create with the provided dto", async () => {
      const createDto: Partial<TestEntity> = {
        name: "New Entity",
        description: "New Description",
        count: 10,
      };

      repositoryMock.create.mockResolvedValue(mockEntity as any);

      const result = await service.create(createDto);

      expect(repositoryMock.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockEntity);
    });
  });

  describe("findById", () => {
    it("should call repository.findById with the provided id", async () => {
      repositoryMock.findById.mockResolvedValue(mockEntity);

      const result = await service.findById(mockEntity._id!);

      expect(repositoryMock.findById).toHaveBeenCalledWith(mockEntity._id);
      expect(result).toEqual(mockEntity);
    });

    it("should return null if entity not found", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById("nonexistent-id");

      expect(repositoryMock.findById).toHaveBeenCalledWith("nonexistent-id");
      expect(result).toBeNull();
    });
  });

  describe("find", () => {
    it("should call repository.find with the provided filter, projection, and options", async () => {
      const filter = { name: "Test" };
      const projection = { name: 1, count: 1 };
      const options = { sort: { createdAt: -1 } };
      const entities = [mockEntity];

      repositoryMock.find.mockResolvedValue(entities);

      const result = await service.find(filter, projection, options);

      expect(repositoryMock.find).toHaveBeenCalledWith(
        filter,
        projection,
        options
      );
      expect(result).toEqual(entities);
    });

    it("should use empty filter if none provided", async () => {
      const entities = [mockEntity];

      repositoryMock.find.mockResolvedValue(entities);

      const result = await service.find();

      expect(repositoryMock.find).toHaveBeenCalledWith(
        {},
        undefined,
        undefined
      );
      expect(result).toEqual(entities);
    });
  });

  describe("update", () => {
    it("should call repository.update with the provided entity", async () => {
      const updateData = {
        _id: mockEntity._id!,
        name: "Updated Entity",
        description: "Updated Description",
      };

      repositoryMock.update.mockResolvedValue(mockEntity);

      const result = await service.update(updateData);

      expect(repositoryMock.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockEntity);
    });

    it("should return null if entity not found", async () => {
      const updateData = {
        _id: "nonexistent-id",
        name: "Updated Entity",
      };

      repositoryMock.update.mockResolvedValue(null);

      const result = await service.update(updateData);

      expect(repositoryMock.update).toHaveBeenCalledWith(updateData);
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should call repository.delete with the provided id", async () => {
      repositoryMock.delete.mockResolvedValue(true);

      const result = await service.delete(mockEntity._id!);

      expect(repositoryMock.delete).toHaveBeenCalledWith(mockEntity._id);
      expect(result).toBe(true);
    });

    it("should return null if entity not found", async () => {
      repositoryMock.delete.mockResolvedValue(null);

      const result = await service.delete("nonexistent-id");

      expect(repositoryMock.delete).toHaveBeenCalledWith("nonexistent-id");
      expect(result).toBeNull();
    });
  });
});
