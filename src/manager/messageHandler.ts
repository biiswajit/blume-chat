import { WebSocket } from "ws";
import { IncommingMessage } from "../message/incommingMessage";
import { SupportedMessage } from "../message/incommingMessage";
import { UserManager } from "./userManager";
import { ChatManager } from "./chatManager";
import {
  OutgoingMessage,
  SupportedOperation,
} from "../message/outgoingMessage";

const userManager = new UserManager();

export async function messageHandler(
  conn: WebSocket,
  message: IncommingMessage,
) {
  if (message.type === SupportedMessage.JoinDiscussion) {
    const payload = message.payload;
    userManager.addUser(
      payload.userName,
      payload.userId,
      payload.discussionId,
      conn,
    );
  }

  if (message.type === SupportedMessage.TextMessage) {
    const payload = message.payload;

    const user = userManager.getUser(payload.userId, payload.discussionId);
    if (!user) {
      console.error("User not found in in-memory store!");
      return;
    }

    const chatManager = await ChatManager.initialize();
    const chat = await chatManager.addChat(
      payload.message,
      user,
      payload.discussionId,
    );
    if (!chat) {
      console.error("Unable to add message to redis");
      return;
    }

    const outgoingMessage: OutgoingMessage = {
      type: SupportedOperation.AddChat,
      payload: {
        chatId: chat.id,
        message: payload.message,
        userId: user.id,
        userName: user.name,
        upvotes: chat.upvotes,
        sentAt: new Date().toString(),
        discussionId: payload.discussionId,
      },
    };
    userManager.broadcast(
      payload.discussionId,
      payload.userId,
      outgoingMessage,
    );
  }

  if (message.type === SupportedMessage.UpvoteMessage) {
    const payload = message.payload;

    const chatManager = await ChatManager.initialize();
    const chat = await chatManager.upvote(payload.chatId);
    if (!chat) {
      console.error("Unable to upvote");
      return;
    }

    const outgoingMessage: OutgoingMessage = {
      type: SupportedOperation.UpdateChat,
      payload: {
        chatId: payload.chatId,
        discussionId: payload.discussionId,
        upvotes: chat.upvotes,
      },
    };
    userManager.broadcast(
      payload.discussionId,
      payload.userId,
      outgoingMessage,
    );
  }
}
