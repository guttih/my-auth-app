import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// docs https://next-auth.js.org/configuration/initialization

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
