import { prisma } from "../db/connectDb";

export default async function generateUniqueCode(
  length: number,
): Promise<string> {
  let code: string | undefined;
  do {
    code = await generateCode(length);
  } while (!isUnique(code));
  return code;
}

async function generateCode(length: number): Promise<string> {
  const pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIdx = Math.floor(Math.random() * pool.length);
    code += pool[randomIdx];
  }
  return code;
}

async function isUnique(code: string): Promise<boolean> {
  const existingClassroom = await prisma.discussion.findUnique({
    where: {
      code: code,
    },
  });

  if (existingClassroom) return false;
  else return true;
}
