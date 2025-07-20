import { ClientNats, ClientProxy } from "@nestjs/microservices";
import { ConversationModel } from "@orbital/characters-typegoose";
import { randomUUID } from "crypto";
import { lastValueFrom } from "rxjs";

describe("ConversationsMicroserviceController (e2e)", () => {
  let client: ClientProxy;
  let createdConversationId: string;
  let createdConversations: any[] = [];

  beforeAll(async () => {
    // Connect directly to the running NATS server
    client = new ClientNats({
      servers: [process.env.NATS_URL || "nats://localhost:4223"],
      queue: "test-client",
    });

    await client.connect();

    // Wait a moment for the connection to be fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up
    try {
      await Promise.all(
        createdConversations.map((conversation) =>
          lastValueFrom(
            client.send(
              "characters-service.ConversationsMicroserviceController.delete",
              conversation._id
            )
          )
        )
      );
    } catch (error) {
      // Error cleanup handled silently
    }

    // Close the client connection
    await client.close();
  });

  it("should be defined", () => {
    expect(client).toBeDefined();
  });

  // Add a test to verify NATS connection
  it("should connect to NATS server", async () => {
    // This test just verifies that the client is connected
    expect(client["natsClient"]).toBeDefined();
  });

  describe("CRUD operations", () => {
    it("should create a conversation", async () => {
      // Arrange
      const conversation: Partial<ConversationModel> = {
        _id: randomUUID(), // Add explicit _id
        name: "E2E Test Conversation",
        characterIds: ["test-character-id"],
        messages: [],
      };

      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.create",
          conversation
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toEqual(conversation.name);
      expect(result.characterIds).toEqual(conversation.characterIds);

      // Store the ID and conversation for later tests and cleanup
      createdConversationId = result._id;
      createdConversations.push(result);
    });

    it("should find a conversation by ID", async () => {
      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.findById",
          { id: createdConversationId }
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toEqual(createdConversationId);
      expect(result.name).toEqual("E2E Test Conversation");
    });

    it("should find conversations by IDs", async () => {
      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.findByIds",
          [createdConversationId]
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(1);
      expect(result[0]._id).toEqual(createdConversationId);
    });

    it("should find all conversations", async () => {
      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.find",
          {}
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((c) => c._id === createdConversationId)).toBe(true);
    });

    it("should update a conversation", async () => {
      // Arrange
      const updateData = {
        id: createdConversationId,
        conversation: {
          name: "Updated E2E Test Conversation",
        },
      };

      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.update",
          {
            _id: createdConversationId,
            name: "Updated E2E Test Conversation",
          }
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toEqual(createdConversationId);
      expect(result.name).toEqual("Updated E2E Test Conversation");
    });

    it("should add a message to a conversation", async () => {
      // Arrange
      const messageData = {
        id: createdConversationId,
        text: "Hello from E2E test",
        characterId: "test-character-id",
      };

      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.addMessage",
          messageData
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toEqual(createdConversationId);
      expect(result.messages).toBeDefined();
      expect(result.messages.length).toEqual(1);
      expect(result.messages[0].content.text).toEqual("Hello from E2E test");
      expect(result.messages[0].characterId).toEqual("test-character-id");
    });

    it("should add a message without characterId", async () => {
      // Arrange
      const messageData = {
        id: createdConversationId,
        text: "Hello from user",
      };

      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.addMessage",
          messageData
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toEqual(createdConversationId);
      expect(result.messages).toBeDefined();
      expect(result.messages.length).toEqual(2);
      expect(result.messages[1].content.text).toEqual("Hello from user");
      expect(result.messages[1].characterId).toBeUndefined();
    });

    it("should delete a conversation", async () => {
      // Act
      const result = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.delete",
          createdConversationId
        )
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toBe(true); // The delete method returns true for successful deletion

      // Verify it's deleted
      // Verify it's deleted
      const deletedConversation = await lastValueFrom(
        client.send(
          "characters-service.ConversationsMicroserviceController.findById",
          { id: createdConversationId }
        )
      );
      expect(deletedConversation).toBeNull();

      // Remove from our cleanup list since it's already deleted
      createdConversations = createdConversations.filter(
        (c) => c._id !== createdConversationId
      );
    });
  });
});
