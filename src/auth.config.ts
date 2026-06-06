import type { Role } from "@/lib/role-permissions";
import type { NextAuthConfig } from "next-auth";

/** Edge middleware용 — Prisma·bcrypt 미사용 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
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
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.studentId = token.studentId as string | null | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
