import { IdentifiableObject } from "@orbital/core";
import { DocumentRepository, WithId } from "@orbital/typegoose";
import { CRUDService, ICRUDService } from "./crud.service";

interface TestEntityProps {
  _id?: string;
  name?: string;
  description?: string;
  count?: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Define a test entity class that extends IdentifiableObject
class TestEntity extends IdentifiableObject {
  name!: string;
  description?: string;
  count!: number;
  tags?: string[];

  constructor(data: TestEntityProps = {}) {
    super(data);
    this.name = data.name || "";
    this.description = data.description;
    this.count = data.count || 0;
    this.tags = data.tags;
  }
}

// Create a concrete implementation of CrudRepository for testing
class TestRepository extends DocumentRepository<TestEntity, TestEntityProps> {
  constructor() {
    super(null as any, null as any); // We'll mock all methods, so we don't need actual params
  }
}

// Create a service that uses composition with CRUDService and implements ICRUDService
class TestService implements ICRUDService<TestEntity, TestEntityProps> {
  protected crudService: CRUDService<
    TestEntity,
    TestEntityProps,
    TestRepository
  >;

  constructor(repository: TestRepository) {
    this.crudService = new CRUDService<
      TestEntity,
      TestEntityProps,
      TestRepository
    >(repository);
  }

  // Proxy methods to the CRUDService
  async create(dto: Parameters<TestRepository["create"]>[0]) {
    return this.crudService.create(dto);
  }

  async find(
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.crudService.find(filter, projection, options);
  }

  async findById(id: string, projection?: Record<string, any>) {
    return this.crudService.findById(id, projection);
  }

  async findByParentId(
    parentId: string,
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.crudService.findByParentId(parentId, projection, options);
  }

  async findByTags(
    tags: string[],
    projection?: Record<string, any>,
    options?: Record<string, any>
  ) {
    return this.crudService.findByTags(tags, projection, options);
  }

  async update(entity: WithId<TestEntityProps>) {
    return this.crudService.update(entity);
  }

  async delete(id: string | string[]) {
    return this.crudService.delete(id);
  }
}

describe("CRUDService", () => {
  let service: TestService;
  let repositoryMock: jest.Mocked<TestRepository>;

  // Mock entity data
  const mockEntity = new TestEntity({
    _id: "test-id-123",
    name: "Test Entity",
    description: "Test Description",
    count: 42,
    tags: ["tag1", "tag2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    // Create a mock for the repository
    repositoryMock = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByParentId: jest.fn(),
      findByTags: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TestRepository>;

    // Create service instance with mock repository
    service = new TestService(repositoryMock);
  });

  describe("create", () => {
    it("should call repository.create with the provided dto", async () => {
      const createDto = {
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

      expect(repositoryMock.findById).toHaveBeenCalledWith(
        mockEntity._id,
        undefined
      );
      expect(result).toEqual(mockEntity);
    });

    it("should return null if entity not found", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById("nonexistent-id");

      expect(repositoryMock.findById).toHaveBeenCalledWith(
        "nonexistent-id",
        undefined
      );
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
        _id: mockEntity._id,
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
