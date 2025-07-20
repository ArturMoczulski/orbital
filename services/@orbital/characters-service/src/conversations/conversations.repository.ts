import { Injectable } from "@nestjs/common";
import { ConversationModel } from "@orbital/characters-typegoose";
import { Model } from "mongoose";
import { InjectModel } from "nestjs-typegoose";

@Injectable()
export class ConversationsRepository {
  constructor(
    @InjectModel(ConversationModel)
    private readonly conversationModel: Model<ConversationModel>
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

  async create(conversation: Partial<ConversationModel>) {
    const createdConversation = new this.conversationModel(conversation);
    return createdConversation.save();
  }

  async update(id: string, conversation: Partial<ConversationModel>) {
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
