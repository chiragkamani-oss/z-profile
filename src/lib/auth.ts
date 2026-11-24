import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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
      id: "google-token",
      name: "Google One-Tap SSO",
      credentials: {
        credential: { label: "Google Credential", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.credential) {
          return null;
        }

        try {
          const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credentials.credential)}`
          );
          if (!res.ok) {
            return null;
          }
          const payload = await res.json();
          const expectedAud =
            process.env.GOOGLE_CLIENT_ID ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            "140409062196-nrqjm53c68gjcrl496gp8lmui1jjaldf.apps.googleusercontent.com";

          if (payload.aud !== expectedAud) {
            return null;
          }
          if (!payload.email || payload.email_verified !== "true") {
            return null;
          }

          // Lookup or auto-provision WordPress user
          let wpUser = await prisma.wp_users.findFirst({
            where: { user_email: payload.email },
            include: { usermeta: true },
          });

          if (!wpUser) {
            const emailPrefix = payload.email
              .split("@")[0]
              .replace(/[^a-zA-Z0-9._-]/g, "");
            const userLogin = `${emailPrefix}_${Date.now().toString().slice(-4)}`;
            wpUser = await prisma.wp_users.create({
              data: {
                user_login: userLogin,
                user_pass: "",
                user_nicename: payload.name || userLogin,
                user_email: payload.email,
                user_url: "",
                user_registered: new Date(),
                display_name: payload.name || emailPrefix,
                usermeta: {
                  create: [
                    {
                      meta_key: "wp_capabilities",
                      meta_value: 'a:1:{s:8:"engineer";b:1;}',
                    },
                    {
                      meta_key: "wp_user_level",
                      meta_value: "1",
                    },
                  ],
                },
              },
              include: { usermeta: true },
            });
          }

          const role = UserRepository.extractRoleFromMeta(wpUser.usermeta);
          const canShareProfile = UserRepository.hasCapability(
            wpUser.usermeta,
            "share_zpp_profile"
          );

          return {
            id: wpUser.ID.toString(),
            name: wpUser.display_name || payload.name || payload.email,
            email: wpUser.user_email,
            role,
            canShareProfile,
          };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
            clientSecret:
              process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
            allowDangerousEmailAccountLinking: true,
          }),
        ]),
    CredentialsProvider({
      id: "credentials",
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Lookup or auto-provision WordPress user account for Google SSO
        let wpUser = await prisma.wp_users.findFirst({
          where: { user_email: user.email },
          include: { usermeta: true },
        });

        if (!wpUser) {
          const emailPrefix = user.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
          const userLogin = `${emailPrefix}_${Date.now().toString().slice(-4)}`;
          wpUser = await prisma.wp_users.create({
            data: {
              user_login: userLogin,
              user_pass: "",
              user_nicename: user.name || userLogin,
              user_email: user.email,
              user_url: "",
              user_registered: new Date(),
              display_name: user.name || emailPrefix,
              usermeta: {
                create: [
                  {
                    meta_key: "wp_capabilities",
                    meta_value: 'a:1:{s:8:"engineer";b:1;}',
                  },
                  {
                    meta_key: "wp_user_level",
                    meta_value: "1",
                  },
                ],
              },
            },
            include: { usermeta: true },
          });
        }

        const role = UserRepository.extractRoleFromMeta(wpUser.usermeta);
        const canShareProfile = UserRepository.hasCapability(
          wpUser.usermeta,
          "share_zpp_profile"
        );

        user.id = wpUser.ID.toString();
        (user as any).role = role;
        (user as any).canShareProfile = canShareProfile;
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.canShareProfile = (user as any).canShareProfile;
      } else if (token.email && (!token.id || !token.role)) {
        const wpUser = await prisma.wp_users.findFirst({
          where: { user_email: token.email },
          include: { usermeta: true },
        });
        if (wpUser) {
          token.id = wpUser.ID.toString();
          token.role = UserRepository.extractRoleFromMeta(wpUser.usermeta);
          token.canShareProfile = UserRepository.hasCapability(
            wpUser.usermeta,
            "share_zpp_profile"
          );
        }
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
