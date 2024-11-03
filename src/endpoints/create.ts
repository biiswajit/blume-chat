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

export default async function (req: Request, res: Response): Promise<{success: boolean, message: string}> {
  const sessionId: string | undefined = req.get("authorization");
  console.log(sessionId)
  if (!sessionId) {
    return {success: false, message: "you're not authorized"}
  }

  const client = await RedisClient.getInstance();
  const session: SessionInfo = JSON.parse(
    JSON.stringify(await client?.hGetAll(`session:${sessionId}`)),
  );
  if (!session) {
    return {success: false, message: "you're not authorized"}
  }

  console.log(session)

  const validUser = await prisma.enrollment.findFirst({
    where: {
      classroomId: session.classroomId,
      userId: session.userId,
    },
  });
  if (!validUser) {
    return {success: false, message: "you're not authorized"}
  }

  console.log(validUser)

  if (session.role !== "Teacher") {
    return {success: false, message: "you're not authorized"}
  }

  const discussionCode: string = await generateUniqueCode(8);
  let discussionId: string | null = null;
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
          createdAt: true
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

      discussionId = discussion.id;
      await client?.hSet(`discussion:${discussionId}`, {
        title: session.discussionName as string,
        id: discussionId,
        createdAt: discussion.createdAt.toString(),
      })
    });

    console.log("discussion created");
    if (discussionId) return {success: true, message: discussionId}
    else throw new Error("unable to find discussion id")
  } catch (err) {
    console.error("error creating discussion" + err);
    return {success: false, message: "there are some error"}
  }
}
