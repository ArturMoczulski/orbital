import { Test, TestingModule } from "@nestjs/testing";
import { ConversationService } from "./conversation.service";
import { ConversationsCRUDService } from "./conversations.crud.service";
import { ConversationsMicroserviceController } from "./conversations.microservice.controller";

// Skip all tests until the libraries are properly built with the new conversation types
describe.skip("ConversationsMicroserviceController", () => {
  let controller: ConversationsMicroserviceController;
  let crudService: ConversationsCRUDService;
  let conversationService: ConversationService;

  beforeEach(async () => {
    // Create mock services
    const mockCRUDService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockConversationService = {
      addMessage: jest.fn(),
    };

    // Create a test module with the controller and mock services
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsMicroserviceController],
      providers: [
        {
          provide: ConversationsCRUDService,
          useValue: mockCRUDService,
        },
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
      ],
    }).compile();

    // Get the controller and services from the test module
    controller = module.get<ConversationsMicroserviceController>(
      ConversationsMicroserviceController
    );
    crudService = module.get<ConversationsCRUDService>(
      ConversationsCRUDService
    );
    conversationService = module.get<ConversationService>(ConversationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call crudService.findAll", async () => {
      // Arrange
      const expectedResult = [{ _id: "1", name: "Test Conversation" }];
      jest.spyOn(crudService, "findAll").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(crudService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findById", () => {
    it("should call crudService.findById with the correct id", async () => {
      // Arrange
      const id = "conversation-id-1";
      const expectedResult = { _id: id, name: "Test Conversation" };
      jest.spyOn(crudService, "findById").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findById(id);

      // Assert
      expect(crudService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByIds", () => {
    it("should call crudService.findByIds with the correct ids", async () => {
      // Arrange
      const ids = ["conversation-id-1", "conversation-id-2"];
      const expectedResult = [
        { _id: ids[0], name: "Test Conversation 1" },
        { _id: ids[1], name: "Test Conversation 2" },
      ];
      jest.spyOn(crudService, "findByIds").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByIds(ids);

      // Assert
      expect(crudService.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("create", () => {
    it("should call crudService.create with the correct conversation", async () => {
      // Arrange
      const conversation = {
        name: "New Conversation",
        characterIds: ["character-id-1"],
      };
      const expectedResult = {
        _id: "new-id",
        ...conversation,
      };
      jest.spyOn(crudService, "create").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(conversation);

      // Assert
      expect(crudService.create).toHaveBeenCalledWith(conversation);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call crudService.update with the correct id and conversation", async () => {
      // Arrange
      const id = "conversation-id-1";
      const conversation = {
        name: "Updated Conversation",
      };
      const data = { id, conversation };
      const expectedResult = {
        _id: id,
        name: "Updated Conversation",
        characterIds: ["character-id-1"],
      };
      jest.spyOn(crudService, "update").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(data);

      // Assert
      expect(crudService.update).toHaveBeenCalledWith(id, conversation);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("delete", () => {
    it("should call crudService.delete with the correct id", async () => {
      // Arrange
      const id = "conversation-id-1";
      const expectedResult = {
        _id: id,
        name: "Deleted Conversation",
      };
      jest.spyOn(crudService, "delete").mockResolvedValue(expectedResult);

      // Act
      const result = await controller.delete(id);

      // Assert
      expect(crudService.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("addMessage", () => {
    it("should call conversationService.addMessage with the correct parameters", async () => {
      // Arrange
      const data = {
        id: "conversation-id-1",
        text: "Hello",
        characterId: "character-id-1",
      };
      const expectedResult = {
        _id: data.id,
        name: "Test Conversation",
        messages: [
          {
            _id: "message-id-1",
            timestamp: new Date(),
            content: { text: data.text },
            characterId: data.characterId,
          },
        ],
      };
      jest
        .spyOn(conversationService, "addMessage")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.addMessage(data);

      // Assert
      expect(conversationService.addMessage).toHaveBeenCalledWith(
        data.id,
        data.text,
        data.characterId
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call conversationService.addMessage without characterId when not provided", async () => {
      // Arrange
      const data = {
        id: "conversation-id-1",
        text: "Hello",
      };
      const expectedResult = {
        _id: data.id,
        name: "Test Conversation",
        messages: [
          {
            _id: "message-id-1",
            timestamp: new Date(),
            content: { text: data.text },
          },
        ],
      };
      jest
        .spyOn(conversationService, "addMessage")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.addMessage(data);

      // Assert
      expect(conversationService.addMessage).toHaveBeenCalledWith(
        data.id,
        data.text,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
