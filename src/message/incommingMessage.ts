import { z } from "zod";

export enum SupportedMessage {
  UpvoteMessage = "UPVOTE_MESSAGE",
  TextMessage = "TEXT_MESSAGE",
  JoinDiscussion = "JOIN_DISCUSSION",
}

export type IncommingMessage =
  | {
      type: SupportedMessage.TextMessage;
      payload: TextMessageType;
    }
  | {
      type: SupportedMessage.UpvoteMessage;
      payload: UpvoteMessageType;
    }
  | {
      type: SupportedMessage.JoinDiscussion;
      payload: InitMessageType;
    };

export const TextMessageSchema = z.object({
  message: z.string().min(1),
  userId: z.string(),
  discussionId: z.string(),
});

export type TextMessageType = z.infer<typeof TextMessageSchema>;

export const UpvoteMessageSchema = z.object({
  chatId: z.string(),
  userId: z.string(),
  discussionId: z.string(),
});

export type UpvoteMessageType = z.infer<typeof UpvoteMessageSchema>;

export const InitMessage = z.object({
  userId: z.string(),
  discussionId: z.string(),
  userName: z.string(),
});

export type InitMessageType = z.infer<typeof InitMessage>;
