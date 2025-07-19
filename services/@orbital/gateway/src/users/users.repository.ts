import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async bulkCreate(
    createUserDtos: { username: string; password: string }[]
  ): Promise<UserDocument[]> {
    return this.userModel.insertMany(createUserDtos, { ordered: false });
  }

  async bulkUpdate(
    updates: { username: string; update: Partial<User> }[]
  ): Promise<UserDocument[]> {
    const ops = updates.map(({ username, update }) => ({
      updateOne: {
        filter: { username },
        update,
      },
    }));
    await this.userModel.bulkWrite(ops, { ordered: false });
    const usernames = updates.map((u) => u.username);
    return this.userModel.find({ username: { $in: usernames } }).exec();
  }

  async bulkFindByUsername(usernames: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ username: { $in: usernames } }).exec();
  }
}
