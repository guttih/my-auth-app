import NextAuth from "next-auth";
import { credentialsProvider } from "@/app/api/auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function validateWithAD(username: string, password: string): Promise<boolean> {
  // Stub for now — replace with real AD validation later
  return false;
}

const handler = NextAuth({
  providers: [credentialsProvider],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
