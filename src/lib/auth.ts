import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.firstName = user.firstName;
      session.user.lastName = user.lastName;
      session.user.currency = user.currency;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) {
          return false;
        }
        
        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: {
            email: user.email
          }
        });

        // If not, create new user
        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email || "",
              image: user.image,
              role: "USER"
            }
          });
        }
      }
      return true;
    }
  },
  pages: {
    signIn: "/login"
  },
  session: { strategy: "jwt" }
} satisfies NextAuthConfig

import { auth } from "@/auth";

export const currentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const currentRole = async () => {
  const session = await auth();
  return session?.user?.role;
};
