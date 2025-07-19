import { Injectable } from "@nestjs/common";
import { Conversation } from "@orbital/characters";
import { Model } from "mongoose";
import { InjectModel } from "nestjs-typegoose";
import { TempConversationModel } from "./conversations.module";

@Injectable()
export class ConversationsRepository {
  constructor(
    @InjectModel(TempConversationModel)
    private readonly conversationModel: Model<any>
  ) {}

  async findAll() {
    return this.conversationModel.find().exec();
  }

  async findById(id: string) {
    return this.conversationModel.findById(id).exec();
  }

  async findByIds(ids: string[]) {
    return this.conversationModel.find({ _id: { $in: ids } }).exec();
  }

  async create(conversation: Partial<Conversation>) {
    const createdConversation = new this.conversationModel(conversation);
    return createdConversation.save();
  }

  async update(id: string, conversation: Partial<Conversation>) {
    return this.conversationModel
      .findByIdAndUpdate(id, conversation, { new: true })
      .exec();
  }

  async delete(id: string) {
    return this.conversationModel.findByIdAndDelete(id).exec();
  }

  async addMessage(
    id: string,
    message: {
      _id: string;
      timestamp: Date;
      content: { text: string };
      characterId?: string;
    }
  ) {
    return this.conversationModel
      .findByIdAndUpdate(id, { $push: { messages: message } }, { new: true })
      .exec();
  }
}
