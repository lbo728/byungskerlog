import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) {
          return null;
        }

        // 데이터베이스에서 관리자 계정 조회
        const admin = await prisma.admin.findUnique({
          where: { username },
        });

        if (!admin) {
          return null;
        }

        // 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: admin.id,
          name: admin.name || "Admin",
          email: admin.email || "admin@blog.com",
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized: async ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const isOnAdminPage = request.nextUrl.pathname.startsWith("/admin");

      if (isOnAdminPage) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
  },
});
