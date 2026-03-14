import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";

// Simple in-memory user store for demo (would use Convex in production)
// Pre-seeded admin user with credentials: razeemarc@gmail.com / Razeema@2002

const users: Array<{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}> = [];

// Function to initialize seeded user
async function initSeedUser() {
  const hash = await bcrypt.hash("Razeema@2002", 10);
  users.push({
    id: "1",
    email: "razeemarc@gmail.com",
    name: "Admin User",
    passwordHash: hash,
  });
}

// Run seed on module load
initSeedUser();

export async function registerUser(email: string, name: string, password: string) {
  const existing = users.find((u) => u.email === email);
  if (existing) {
    throw new Error("User already exists");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    email,
    name,
    passwordHash,
  };
  users.push(user);
  return user;
}

export async function getUserByEmail(email: string) {
  return users.find((u) => u.email === email);
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email as string);
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}