// src/app/api/auth/providers/steam.ts
import type { NextRequest } from "next/server";
import type { Provider } from "next-auth/providers";
import Steam from "next-auth-steam";

export default function steamProvider(req?: NextRequest): Provider {
    const base = req
        ? `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("x-forwarded-host") ?? req.headers.get("host")}`
        : process.env.NEXTAUTH_URL!;
    const realm = base;
    const returnUrl = `${base}/api/auth/callback/steam`;

    const profile = (openid: any) => {
        const claimed = openid?.claimedId ?? openid?.claimed_id ?? openid?.identity ?? openid?.openid_identity ?? "";
        const id = String(claimed).split("/").filter(Boolean).pop();
        if (!id) throw new Error("Steam OpenID response missing identity/steamid");
        return { id, name: null, email: null, image: null };
    };

    console.log("[steam] NO profile fetch; realm:", realm, "returnUrl:", returnUrl);

    return Steam(req ?? ({ headers: { get: () => null }, url: base } as unknown as NextRequest), {
        clientSecret: process.env.STEAM_SECRET!,
        realm,
        returnUrl,
        profile, // <= forces NextAuth to use our minimal user
        fetchProfile: false as any,
        skipProfile: true as any,
        // DO NOT pass apiKey here; some forks treat it as "fetch info now"
    }) as unknown as Provider;
}
