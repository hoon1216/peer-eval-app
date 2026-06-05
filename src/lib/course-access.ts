import { buildJoinUrl } from "@/lib/access-link";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type CourseByTokenRow = {
  id: string;
  name: string;
  semester: string;
};

/** Prisma 클라이언트가 오래된 경우에도 DB의 accessToken 컬럼을 사용 */
export async function findCourseByAccessToken(token: string) {
  try {
    const rows = await prisma.$queryRaw<CourseByTokenRow[]>`
      SELECT id, name, semester FROM Course WHERE accessToken = ${token} LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (err) {
    console.error("findCourseByAccessToken failed:", err);
    return null;
  }
}

async function readAccessToken(courseId: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ accessToken: string | null }[]>`
      SELECT accessToken FROM Course WHERE id = ${courseId} LIMIT 1
    `;
    return rows[0]?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function writeAccessToken(courseId: string, token: string) {
  await prisma.$executeRaw`
    UPDATE Course SET accessToken = ${token} WHERE id = ${courseId}
  `;
}

export async function ensureCourseAccessToken(courseId: string) {
  try {
    const exists = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!exists) return null;

    let token = await readAccessToken(courseId);
    if (!token) {
      token = randomUUID();
      await writeAccessToken(courseId, token);
    }

    return { accessToken: token, joinUrl: buildJoinUrl(token) };
  } catch (err) {
    console.error("ensureCourseAccessToken failed:", err);
    return null;
  }
}
