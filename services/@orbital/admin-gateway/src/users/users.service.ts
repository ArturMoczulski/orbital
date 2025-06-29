import { Injectable } from "@nestjs/common";
import { BulkItemizedResponse, itemized } from "@orbital/bulk-operations";
import { User, UserDocument } from "./schemas/user.schema";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(
    createUserDtos: { username: string; password: string }[]
  ): Promise<
    BulkItemizedResponse<{ username: string; password: string }, UserDocument>
  > {
    return itemized<{ username: string; password: string }, UserDocument>(
      createUserDtos,
      async (
        items: { username: string; password: string }[],
        success: (
          item: { username: string; password: string },
          data: UserDocument
        ) => void,
        fail: (
          item: { username: string; password: string },
          error: Error
        ) => void
      ) => {
        const docs = await this.usersRepository.bulkCreate(items);
        const successMap = new Map(
          docs.map((doc: UserDocument) => [doc.username, doc])
        );
        for (const dto of items) {
          const doc = successMap.get(dto.username);
          if (doc) {
            success(dto, doc);
          } else {
            fail(dto, new Error("Insert failed"));
          }
        }
      }
    );
  }

  async update(
    updates: { username: string; update: Partial<User> }[]
  ): Promise<
    BulkItemizedResponse<
      { username: string; update: Partial<User> },
      UserDocument | null
    >
  > {
    return itemized<
      { username: string; update: Partial<User> },
      UserDocument | null
    >(
      updates,
      async (
        items: { username: string; update: Partial<User> }[],
        success: (
          item: { username: string; update: Partial<User> },
          data: UserDocument | null
        ) => void,
        fail: (
          item: { username: string; update: Partial<User> },
          error: Error
        ) => void
      ) => {
        const updatedDocs = await this.usersRepository.bulkUpdate(items);
        const updatedMap = new Map(
          updatedDocs.map((doc: UserDocument) => [doc.username, doc])
        );
        for (const { username, update } of items) {
          const doc = updatedMap.get(username);
          if (doc) {
            success({ username, update }, doc);
          } else {
            fail({ username, update }, new Error("User not found"));
          }
        }
      }
    );
  }

  async findByUsername(
    usernames: string | string[]
  ): Promise<BulkItemizedResponse<string, UserDocument | null>> {
    const usernameArr = Array.isArray(usernames) ? usernames : [usernames];
    const users = await this.usersRepository.bulkFindByUsername(usernameArr);
    const userMap = new Map(users.map((u: UserDocument) => [u.username, u]));
    return itemized<string, UserDocument | null>(
      usernameArr,
      async (
        items: string[],
        success: (item: string, data: UserDocument | null) => void,
        fail: (item: string, error: Error) => void
      ) => {
        for (const username of items) {
          if (userMap.has(username)) {
            success(username, userMap.get(username)!);
          } else {
            success(username, null);
          }
        }
      }
    );
  }
}
