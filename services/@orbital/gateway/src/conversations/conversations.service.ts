import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ConversationsService {
  constructor(
    @Inject("NATS_CLIENT")
    private readonly client: ClientProxy
  ) {}

  async findAll() {
    return firstValueFrom(
      this.client.send({ cmd: "findAllConversations" }, {})
    );
  }

  async findById(id: string) {
    return firstValueFrom(
      this.client.send({ cmd: "findConversationById" }, id)
    );
  }

  async create(conversation: any) {
    return firstValueFrom(
      this.client.send({ cmd: "createConversation" }, conversation)
    );
  }

  async update(id: string, conversation: any) {
    return firstValueFrom(
      this.client.send({ cmd: "updateConversation" }, { id, conversation })
    );
  }

  async delete(id: string) {
    return firstValueFrom(this.client.send({ cmd: "deleteConversation" }, id));
  }

  async addMessage(id: string, text: string, characterId?: string) {
    return firstValueFrom(
      this.client.send(
        { cmd: "addMessageToConversation" },
        { id, text, characterId }
      )
    );
  }
}
