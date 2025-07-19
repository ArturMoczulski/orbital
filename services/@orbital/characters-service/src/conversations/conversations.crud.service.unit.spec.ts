import { Test, TestingModule } from "@nestjs/testing";
import { ConversationsCRUDService } from "./conversations.crud.service";
import { ConversationsRepository } from "./conversations.repository";

describe("ConversationsCRUDService", () => {
  let service: ConversationsCRUDService;
  let repository: ConversationsRepository;

  beforeEach(async () => {
    // Create a mock repository
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addMessage: jest.fn(),
    };

    // Create a test module with the service and mock repository
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsCRUDService,
        {
          provide: ConversationsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get the service and repository from the test module
    service = module.get<ConversationsCRUDService>(ConversationsCRUDService);
    repository = module.get<ConversationsRepository>(ConversationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should call repository.findAll", async () => {
      // Arrange
      const expectedResult = [{ _id: "1", name: "Test Conversation" }];
      jest.spyOn(repository, "findAll").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findAll();

      // Assert
      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call repository.findById with the correct id", async () => {
      // Arrange
      const id = "conversation-id-1";
      const expectedResult = { _id: id, name: "Test Conversation" };
      jest.spyOn(repository, "findById").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findById(id);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByIds", () => {
    it("should call repository.findByIds with the correct ids", async () => {
      // Arrange
      const ids = ["conversation-id-1", "conversation-id-2"];
      const expectedResult = [
        { _id: ids[0], name: "Test Conversation 1" },
        { _id: ids[1], name: "Test Conversation 2" },
      ];
      jest.spyOn(repository, "findByIds").mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByIds(ids);

      // Assert
      expect(repository.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("create", () => {
    it("should call repository.create with the correct conversation", async () => {
      // Arrange
      const conversation = {
        name: "New Conversation",
        characterIds: ["character-id-1"],
      };
      const expectedResult = {
        _id: "new-id",
        ...conversation,
      };
      jest.spyOn(repository, "create").mockResolvedValue(expectedResult);

      // Act
      const result = await service.create(conversation);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(conversation);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call repository.update with the correct id and conversation", async () => {
      // Arrange
      const id = "conversation-id-1";
      const conversation = {
        name: "Updated Conversation",
      };
      const expectedResult = {
        _id: id,
        name: "Updated Conversation",
        characterIds: ["character-id-1"],
      };
      jest.spyOn(repository, "update").mockResolvedValue(expectedResult);

      // Act
      const result = await service.update(id, conversation);

      // Assert
      expect(repository.update).toHaveBeenCalledWith(id, conversation);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call repository.delete with the correct id", async () => {
      // Arrange
      const id = "conversation-id-1";
      const expectedResult = {
        _id: id,
        name: "Deleted Conversation",
      };
      jest.spyOn(repository, "delete").mockResolvedValue(expectedResult);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("addMessage", () => {
    it("should call repository.addMessage with the correct id and message", async () => {
      // Arrange
      const id = "conversation-id-1";
      const message = {
        _id: "message-id-1",
        timestamp: new Date(),
        content: { text: "Hello" },
        characterId: "character-id-1",
      };
      const expectedResult = {
        _id: id,
        name: "Test Conversation",
        messages: [message],
      };
      jest.spyOn(repository, "addMessage").mockResolvedValue(expectedResult);

      // Act
      const result = await service.addMessage(id, message);

      // Assert
      expect(repository.addMessage).toHaveBeenCalledWith(id, message);
      expect(result).toEqual(expectedResult);
    });
  });
});
