// src/types/next-auth-steam.d.ts

declare module "next-auth-steam" {
    import type { NextApiRequest } from "next";
    import type { NextRequest } from "next/server";
    import type { Provider } from "next-auth/providers";

    type Req = NextRequest | NextApiRequest | any;

    // The lib exports a default factory that returns a Provider.
    export default function Steam(req: Req, options?: Record<string, unknown>): Provider;
}
