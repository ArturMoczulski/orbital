import { Controller, UseFilters } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { Conversation, ConversationProps } from "@orbital/characters";
import { WithId, WithoutId } from "@orbital/core";
import { PassThroughRpcExceptionFilter } from "@orbital/microservices";
import { CRUDController } from "@orbital/nest";
import { ConversationService } from "./conversation.service";
import { ConversationsCRUDService } from "./conversations.crud.service";

@Controller()
@UseFilters(new PassThroughRpcExceptionFilter("conversation"))
export class ConversationsMicroserviceController extends CRUDController<
  Conversation,
  ConversationProps,
  ConversationsCRUDService
> {
  constructor(
    conversationsCRUDService: ConversationsCRUDService,
    private readonly conversationService: ConversationService
  ) {
    super(conversationsCRUDService);
  }

  @MessagePattern(
    "characters-service.ConversationsMicroserviceController.create"
  )
  async create(dto: WithoutId<Conversation> | WithoutId<Conversation>[]) {
    return super.create(dto);
  }

  @MessagePattern("characters-service.ConversationsMicroserviceController.find")
  async find(payload: {
    filter?: Record<string, any>;
    projection?: Record<string, any>;
    options?: Record<string, any>;
  }) {
    return super.find(payload);
  }

  @MessagePattern(
    "characters-service.ConversationsMicroserviceController.findById"
  )
  async findById(payload: { id: string; projection?: Record<string, any> }) {
    return super.findById(payload);
  }

  @MessagePattern(
    "characters-service.ConversationsMicroserviceController.findByIds"
  )
  async findByIds(ids: string[]): Promise<Conversation[]> {
    return this.service.findByIds(ids);
  }

  @MessagePattern(
    "characters-service.ConversationsMicroserviceController.update"
  )
  async update(data: WithId<Conversation> | WithId<Conversation>[]) {
    // Force type cast to bypass the type checking
    return super.update(data as any);
  }

  @MessagePattern(
    "characters-service.ConversationsMicroserviceController.delete"
  )
  async delete(ids: string | string[]) {
    return super.delete(ids);
  }

  @MessagePattern(
    "characters-service.ConversationsMicroserviceController.addMessage"
  )
  async addMessage(data: {
    id: string;
    text: string;
    characterId?: string;
  }): Promise<Conversation | null> {
    return this.conversationService.addMessage(
      data.id,
      data.text,
      data.characterId
    );
  }
}
