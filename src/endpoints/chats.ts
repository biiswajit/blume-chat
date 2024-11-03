import { Request, Response } from "express";
import { ChatManager, Chat} from "../manager/chatManager";

export default async function (req: Request, res: Response) {
  const discussionId = req.get("discussionId");
  console.log(discussionId);
  if (!discussionId) {
    return {success: false, message: "discussionId not found"}
  }

  const chatManager = await ChatManager.initialize()
  const chats = await chatManager.getChats(discussionId);
  return {success: true, messsage: chats}
}
