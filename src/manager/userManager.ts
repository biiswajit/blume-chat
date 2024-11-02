import { WebSocket } from "ws";
import { OutgoingMessage } from "../message/outgoingMessage";

export type User = {
  name: string;
  id: string;
  conn: WebSocket;
};

export type Discussion = {
  users: User[];
};

export class UserManager {
  private discussions: Map<string, Discussion>;
  constructor() {
    this.discussions = new Map<string, Discussion>();
  }

  addUser(
    userName: string,
    userId: string,
    discussionId: string,
    conn: WebSocket,
  ) {
    if (!this.discussions.get(discussionId)) {
      this.discussions.set(discussionId, {
        users: [],
      });
    }
    this.discussions.get(discussionId)?.users.push({
      id: userId,
      name: userName,
      conn,
    });
    conn.on("close", (code, reason) => {
      this.removeUser(userId, discussionId);
    });
  }

  removeUser(userId: string, discussionId: string) {
    const users = this.discussions.get(discussionId)?.users;
    if (users) {
      users.filter(({ id }) => id != userId);
    }
  }

  getUser(userId: string, discussionId: string): User | null {
    const users = this.discussions.get(discussionId)?.users;
    const user = users?.find(({ id }) => id === userId);
    return user ?? null;
  }

  broadcast(discussionId: string, userId: string, message: OutgoingMessage) {
    const discussion: Discussion | undefined =
      this.discussions.get(discussionId);
    if (!discussion) {
      console.error(
        "The room on which you want to broadcast a message not found",
      );
    }

    const user = this.getUser(userId, discussionId);
    if (!user) {
      console.error(
        "User who wants to broadcast a message not found in the room",
      );
      return;
    }

    discussion?.users.forEach(({ id, conn }) => {
      if (!(id === userId)) {
        conn.send(JSON.stringify(message));
      }
    });
  }
}
