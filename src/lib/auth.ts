import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyWordPressPassword } from "@/server/utils/password-hasher";
import { UserRepository } from "@/server/repositories/user.repository";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours session timeout for security
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "WordPress Credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const usernameOrEmail = credentials.username.trim();

        // Safe parameterized lookup via Prisma
        const user = await prisma.wp_users.findFirst({
          where: {
            OR: [{ user_login: usernameOrEmail }, { user_email: usernameOrEmail }],
          },
          include: {
            usermeta: true,
          },
        });

        if (!user || !user.user_pass) {
          return null;
        }

        // Verify password against WordPress phpass / bcrypt / md5 hash
        const isValid = verifyWordPressPassword(credentials.password, user.user_pass);
        if (!isValid) {
          return null;
        }

        // Extract role and capabilities from usermeta
        const role = UserRepository.extractRoleFromMeta(user.usermeta);
        const canShareProfile = UserRepository.hasCapability(
          user.usermeta,
          "share_zpp_profile"
        );

        return {
          id: user.ID.toString(),
          name: user.display_name || user.user_nicename || user.user_login,
          email: user.user_email,
          role,
          canShareProfile,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.canShareProfile = (user as any).canShareProfile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).canShareProfile = token.canShareProfile;
      }
      return session;
    },
  },
};
