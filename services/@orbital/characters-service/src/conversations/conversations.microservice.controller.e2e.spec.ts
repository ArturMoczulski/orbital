import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientProxy, ClientsModule, Transport } from "@nestjs/microservices";
import { Test, TestingModule } from "@nestjs/testing";
import { ConversationModel } from "@orbital/characters-typegoose";
import { firstValueFrom } from "rxjs";

describe("ConversationsMicroserviceController (e2e)", () => {
  let clientProxy: ClientProxy;
  let moduleRef: TestingModule;
  let createdConversationId: string;

  beforeAll(async () => {
    // Create a test module with the necessary providers
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env.local",
          expandVariables: true,
        }),
        ClientsModule.registerAsync([
          {
            name: "NATS_CLIENT",
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              transport: Transport.NATS,
              options: {
                servers: [
                  configService.get<string>(
                    "NATS_URL",
                    "nats://localhost:4223"
                  ),
                ],
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
    }).compile();

    // Get the client proxy from the test module
    clientProxy = moduleRef.get<ClientProxy>("NATS_CLIENT");

    // Connect to the NATS server
    await clientProxy.connect();
  });

  afterAll(async () => {
    // Clean up resources
    await clientProxy.close();
    await moduleRef.close();
  });

  it("should be defined", () => {
    expect(clientProxy).toBeDefined();
  });

  describe("CRUD operations", () => {
    it("should create a conversation", async () => {
      // Arrange
      const conversation: Partial<ConversationModel> = {
        name: "E2E Test Conversation",
        characterIds: ["test-character-id"],
        messages: [],
      };

      // Act
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "createConversation" }, conversation)
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toEqual(conversation.name);
      expect(result.characterIds).toEqual(conversation.characterIds);

      // Store the ID for later tests
      createdConversationId = result._id;
    });

    it("should find a conversation by ID", async () => {
      // Act
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "findConversationById" }, createdConversationId)
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toEqual(createdConversationId);
      expect(result.name).toEqual("E2E Test Conversation");
    });

    it("should find conversations by IDs", async () => {
      // Act
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "findConversationsByIds" }, [
          createdConversationId,
        ])
      );

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(1);
      expect(result[0]._id).toEqual(createdConversationId);
    });

    it("should find all conversations", async () => {
      // Act
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "findAllConversations" }, {})
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
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "updateConversation" }, updateData)
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
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "addMessageToConversation" }, messageData)
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
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "addMessageToConversation" }, messageData)
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
      const result = await firstValueFrom(
        clientProxy.send({ cmd: "deleteConversation" }, createdConversationId)
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id).toEqual(createdConversationId);

      // Verify it's deleted
      try {
        await firstValueFrom(
          clientProxy.send(
            { cmd: "findConversationById" },
            createdConversationId
          )
        );
        fail("Expected conversation to be deleted");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
