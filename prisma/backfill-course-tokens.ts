import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.$queryRaw<{ id: string; accessToken: string | null }[]>`
    SELECT id, accessToken FROM Course
  `;

  let updated = 0;
  for (const course of courses) {
    if (course.accessToken) continue;
    const token = randomUUID();
    await prisma.$executeRaw`
      UPDATE Course SET accessToken = ${token} WHERE id = ${course.id}
    `;
    updated += 1;
  }

  console.log(`평가 접속 토큰 보완: ${updated}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
