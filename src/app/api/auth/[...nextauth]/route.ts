import NextAuth from "next-auth";
import { credentialsProvider } from "@/app/api/auth/providers/credentials";
import { prisma } from "@/lib/prisma";

import bcrypt from "bcrypt";


async function validateWithAD(username: string, password: string): Promise<boolean> {
  // Stub for now — replace with real AD validation later
  return false;
}

// docs https://next-auth.js.org/configuration/initialization
const handler = NextAuth({
  providers: [credentialsProvider],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
