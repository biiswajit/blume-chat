import { User } from "../manager/userManager";

export type MessagePayload = {
  chatId: string;
  message: string;
  userName: string;
  userId: string;
  upvotes: number;
  sentAt: string;
  discussionId: string;
};

export enum SupportedOperation {
  AddChat = "ADD_CHAT",
  UpdateChat = "UPDATE_CHAT",
}

export type OutgoingMessage =
  | {
      type: SupportedOperation.AddChat;
      payload: MessagePayload;
    }
  | {
      type: SupportedOperation.UpdateChat;
      payload: Partial<MessagePayload>;
    };
