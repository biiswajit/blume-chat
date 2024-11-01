import { Request, Response } from "express";
import RedisClient from "../db/connectCache";
import { prisma } from "../db/connectDb";
import generateUniqueCode from "../functions/generateCode";

export type SessionInfo = {
  discussionName?: string;
  classroomId: string;
  discussionCode?: string;
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

  if (session.role !== "Teacher") {
    return res
      .json({
        success: false,
        message: "You're unauthorized",
      })
      .status(401);
  }

  const discussionCode: string = await generateUniqueCode(8);

  try {
    await prisma.$transaction(async (tx) => {
      const discussion = await tx.discussion.create({
        data: {
          name: session.discussionName as string,
          classroomId: session.classroomId,
          createdById: session.userId,
          code: discussionCode,
        },
        select: {
          id: true,
        },
      });

      await tx.participation.create({
        data: {
          discussionId: discussion.id,
          userId: session.userId,
          role: session.role,
        },
      });
      await client?.hSet(`session:${sessionId}`, {
        ...session,
        permission: "Create",
        discussionCode,
      });
    });

    console.log("discussion created");
  } catch (err) {
    console.error("error creating discussion" + err);
  }
}
