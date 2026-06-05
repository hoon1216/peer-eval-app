import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  studentId: z.string().optional(),
  role: z.enum(["PROFESSOR", "STUDENT"]),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { email, password, name, studentId, role } = parsed.data;
  const normalizedName = name.trim();

  if (!normalizedName) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  if (role === "STUDENT" && !studentId) {
    return NextResponse.json({ error: "학생은 학번이 필요합니다." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: normalizedName,
      studentId: role === "STUDENT" ? studentId : null,
      passwordHash,
      role,
      profileComplete: true,
    },
    select: { id: true, email: true, name: true, role: true, studentId: true },
  });

  return NextResponse.json(user, { status: 201 });
}
