import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginRoleToDbRole } from "@/lib/permissions";
import { normalizeParticipantName } from "@/lib/participant-name";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name: string;
      role: Role;
      studentId?: string | null;
    };
  }

  interface User {
    role: Role;
    studentId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    studentId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "이름", type: "text" },
        password: { label: "비밀번호", type: "password" },
        loginRole: { label: "역할", type: "text" },
      },
      async authorize(credentials) {
        const username = normalizeParticipantName(
          (credentials?.username as string | undefined) ?? ""
        );
        const password = credentials?.password as string | undefined;
        const loginRole = String(credentials?.loginRole ?? "");
        const expectedRole = loginRoleToDbRole(loginRole);

        if (!username || !password || !expectedRole) return null;

        const candidates = await prisma.user.findMany({
          where: { role: expectedRole },
          orderBy: { createdAt: "asc" },
        });
        const nameMatches = candidates.filter(
          (u) =>
            normalizeParticipantName(u.name) === username ||
            (u.email && u.email.toLowerCase() === username.toLowerCase())
        );

        let user: (typeof candidates)[number] | null = null;
        for (const candidate of nameMatches) {
          if (await bcrypt.compare(password, candidate.passwordHash)) {
            user = candidate;
            break;
          }
        }
        if (!user) return null;

        if (!user.profileComplete && user.role !== "PROFESSOR") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.studentId = token.studentId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
