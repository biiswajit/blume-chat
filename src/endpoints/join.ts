import { Request, Response } from "express";
import RedisClient from "../db/connectCache";
import { prisma } from "../db/connectDb";

export type SessionInfo = {
  classroomId: string;
  discussionName?: string;
  discussionCode?: string;
  userId: string;
  role: "Teacher" | "Student";
  email: string;
  permission: "Create" | "Join" | "Nil";
};

export default async function (req: Request, res: Response) {
  const sessionId: string | undefined = req.get("authorization");
  if (!sessionId) {
    return {success: false, message: "Session id not provided"}
  }

  const client = await RedisClient.getInstance();
  const session: SessionInfo = JSON.parse(
    JSON.stringify(await client?.hGetAll(`session:${sessionId}`)),
  );
  if (!session) {
    return {success: false, message: "Session info not found on redis"}
  }

  const validUser = await prisma.enrollment.findFirst({
    where: {
      classroomId: session.classroomId,
      userId: session.userId,
    },
  });
  if (!validUser) {
    return {success: false, message: "You're not enrolled with the classroom"}
  }

  if (session.role !== "Student") {
    return {success: false, message: "You have to be a student to join a discussion"}
  }

  let discussionId: string | undefined;
  try {
    await prisma.$transaction(async (tx) => {
      const discussion = await prisma.discussion.findFirst({
        where: {
          code: session.discussionCode,
        },
        select: {
          id: true,
          name: true,
          createdAt: true
        },
      });
      if (!discussion) throw new Error("discussion not found")
      await prisma.participation.create({
        data: {
          userId: session.userId,
          discussionId: discussion?.id as string,
          role: session.role,
        },
      });
      await client?.hSet(`session:${sessionId}`, {
        ...session,
        permission: "Join",
        discussionName: discussion?.name as string,
      });
      discussionId = discussion.id;
      await client?.hSet(`discussion:${discussionId}`, {
        title: discussion.name as string,
        id: discussionId as string,
        createdAt: discussion.createdAt.toString(),
      })
    });

    console.log("joined to discussion");
    return {success: true, message: discussionId}
  } catch (err) {
    console.error("Failed to join discussion" + err);
    return {success: false, message: "either problem with db or redis"}
  }
}
