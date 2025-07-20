import { Test, TestingModule } from "@nestjs/testing";
import { ConversationModel } from "@orbital/characters-typegoose";
import { ConversationService } from "./conversation.service";
import { ConversationsCRUDService } from "./conversations.crud.service";

describe("ConversationService", () => {
  let service: ConversationService;
  let crudService: ConversationsCRUDService;

  beforeEach(async () => {
    // Create a mock CRUD service
    const mockCRUDService = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addMessage: jest.fn(),
    };

    // Create a test module with the service and mock CRUD service
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: ConversationsCRUDService,
          useValue: mockCRUDService,
        },
      ],
    }).compile();

    // Get the service and CRUD service from the test module
    service = module.get<ConversationService>(ConversationService);
    crudService = module.get<ConversationsCRUDService>(
      ConversationsCRUDService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getConversation", () => {
    it("should call crudService.findById with the correct id", async () => {
      // Arrange
      const id = "conversation-id-1";
      const expectedResult = {
        _id: id,
        name: "Test Conversation",
        messages: [],
        characterIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        addMessage: jest.fn(),
      } as unknown as ConversationModel;
      jest.spyOn(crudService, "findById").mockResolvedValue(expectedResult);

      // Act
      const result = await service.getConversation(id);

      // Assert
      expect(crudService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("createConversation", () => {
    it("should call crudService.create with the correct conversation", async () => {
      // Arrange
      const conversation = {
        name: "New Conversation",
        characterIds: ["character-id-1"],
      };
      const expectedResult = {
        _id: "new-id",
        name: "New Conversation",
        characterIds: ["character-id-1"],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        addMessage: jest.fn(),
      } as unknown as ConversationModel;
      jest.spyOn(crudService, "create").mockResolvedValue(expectedResult);

      // Act
      const result = await service.createConversation(conversation);

      // Assert
      expect(crudService.create).toHaveBeenCalledWith(conversation);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("updateConversation", () => {
    it("should call crudService.update with the correct id and conversation", async () => {
      // Arrange
      const id = "conversation-id-1";
      const conversation = {
        name: "Updated Conversation",
      };
      const expectedResult = {
        _id: id,
        name: "Updated Conversation",
        characterIds: ["character-id-1"],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        addMessage: jest.fn(),
      } as unknown as ConversationModel;
      jest.spyOn(crudService, "update").mockResolvedValue(expectedResult);

      // Act
      const result = await service.updateConversation(id, conversation);

      // Assert
      expect(crudService.update).toHaveBeenCalledWith({
        _id: id,
        ...conversation,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe("deleteConversation", () => {
    it("should call crudService.delete with the correct id", async () => {
      // Arrange
      const id = "conversation-id-1";
      const expectedResult = true;
      jest.spyOn(crudService, "delete").mockResolvedValue(expectedResult);

      // Act
      const result = await service.deleteConversation(id);

      // Assert
      expect(crudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("addMessage", () => {
    it("should call crudService.addMessage with the correct id and message", async () => {
      // Arrange
      const id = "conversation-id-1";
      const text = "Hello";
      const characterId = "character-id-1";

      // Mock the random ID generation
      jest.spyOn(Math, "random").mockReturnValue(0.5);

      const expectedMessage = {
        _id: expect.any(String),
        timestamp: expect.any(Date),
        content: { text },
        characterId,
      };

      const expectedResult = {
        _id: id,
        name: "Test Conversation",
        messages: [expectedMessage],
        characterIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        addMessage: jest.fn(),
      } as unknown as ConversationModel;

      jest.spyOn(crudService, "addMessage").mockResolvedValue(expectedResult);

      // Act
      const result = await service.addMessage(id, text, characterId);

      // Assert
      expect(crudService.addMessage).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          content: { text },
          characterId,
        })
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call crudService.addMessage without characterId when not provided", async () => {
      // Arrange
      const id = "conversation-id-1";
      const text = "Hello";

      // Mock the random ID generation
      jest.spyOn(Math, "random").mockReturnValue(0.5);

      const expectedMessage = {
        _id: expect.any(String),
        timestamp: expect.any(Date),
        content: { text },
      };

      const expectedResult = {
        _id: id,
        name: "Test Conversation",
        messages: [expectedMessage],
        characterIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        addMessage: jest.fn(),
      } as unknown as ConversationModel;

      jest.spyOn(crudService, "addMessage").mockResolvedValue(expectedResult);

      // Act
      const result = await service.addMessage(id, text);

      // Assert
      expect(crudService.addMessage).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          content: { text },
        })
      );
      expect(crudService.addMessage).toHaveBeenCalledWith(
        id,
        expect.not.objectContaining({
          characterId: expect.anything(),
        })
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
