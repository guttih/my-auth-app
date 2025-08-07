import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

async function validateWithAD(username: string, password: string): Promise<boolean> {
    // Stub for now — replace with real AD validation later
    return false;
}

// docs https://next-auth.js.org/configuration/initialization
// const handler = NextAuth({
//     providers: [credentialsProvider],
//     session: { strategy: "jwt" },
// });

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
