import { Request, Response } from "express";
import RedisClient from "../db/connectCache";
import { prisma } from "../db/connectDb";

export type SessionInfo = {
  name: string;
  classroomId: string;
  code?: string;
  userId: string;
  role: "Teacher" | "Student";
  email: string;
  permission: "Create" | "Join" | "Nil";
};

export default async function (req: Request, res: Response) {
  const sessionId: string | undefined = req.get("authorization");
  if (!sessionId) {
    return res
      .json({
        success: false,
        message: "You're not authorized!",
      })
      .status(401);
  }

  const client = await RedisClient.getInstance();
  const session: SessionInfo = JSON.parse(
    JSON.stringify(await client?.hGetAll(`session:${sessionId}`)),
  );
  if (!session) {
    return res
      .json({
        success: false,
        message: "You're not authorized",
      })
      .status(401);
  }

  const validUser = await prisma.enrollment.findFirst({
    where: {
      classroomId: session.classroomId,
      userId: session.userId,
    },
  });
  if (!validUser) {
    return res
      .json({
        success: false,
        message: "You're not authorized",
      })
      .status(401);
  }

  if (session.role !== "Student") {
    return res
      .json({
        success: false,
        message: "You're unauthorized",
      })
      .status(401);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const discussion = await prisma.discussion.findFirst({
        where: {
          code: session.code,
        },
        select: {
          id: true,
          name: true,
        },
      });
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
    });

    console.log("joined to discussion");
  } catch (err) {
    console.error("Failed to join discussion");
  }
}
