import { User } from "./userManager";
import RedisClient from "../db/connectCache";
import { RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";

/*
discussion:{discussionId} = {
  title: string
  id: string
  createdAt: id
  users: string[]
}

in memory user storage

discussion:{discussionId}:chats = list(chat:{chatId}, chat:{chatId}, ...)

chat:{chatId} = {
  message: string
  id: string
  userId: string,
  userName: string,
  discussionId: string
}

disussion:{discussionId}:votes = list(vote:{chatId}, vote:{chatId}, ...)

vote:{chatId} = number
*/

export type Chat = {
  id: string;
  message: string;
  discussionId: string;
  userName: string;
  userId: string;
  upvotes: number;
};

export class ChatManager {
  private client: RedisClientType | null = null;
  private constructor(client: RedisClientType | null) {
    this.client = client;
  }

  public static async initialize(): Promise<ChatManager> {
    const client = await RedisClient.getInstance();
    return new ChatManager(client);
  }

  public async addChat(
    message: string,
    user: User,
    discussionId: string,
  ): Promise<Chat> {
    const chatId = uuidv4();
    await this.client?.hSet(`chat:${chatId}`, {
      message,
      id: chatId,
      userId: user.id,
      userName: user.name,
      discussionId,
    });
    await this.client?.set(`vote:${chatId}`, 0);
    await this.client?.lPush(`discussion:${discussionId}:votes`, chatId);
    await this.client?.lPush(`discussion:${discussionId}:chats`, chatId);

    return await this.getChat(chatId);
  }

  async upvote(chatId: string) {
    const currentVoteCount = await this.client?.get(`vote:${chatId}`);
    await this.client?.set(
      `vote:${chatId}`,
      currentVoteCount ? parseInt(currentVoteCount) + 1 : 0,
    );

    return await this.getChat(chatId);
  }

  async getChats(discussionId: string) {
    const chatIds = await this.client?.lRange(
      `discussion:${discussionId}:chats`,
      0,
      -1,
    );
    const chats: Chat[] = [];
    chatIds?.forEach(async (chatId) => {
      const chat = await this.getChat(chatId);
      chats.push(chat);
    });
    return chats.reverse();
  }

  async getChat(chatId: string): Promise<Chat> {
    const data = await this.client?.hGetAll(`chat:${chatId}`);
    const chatPayload = JSON.parse(JSON.stringify(data));
    chatPayload.upvotes = await this.client?.get(`vote:${chatId}`);
    return chatPayload;
  }
}
