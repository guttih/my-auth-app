// src/app/api/upload/profile-image/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

export const config = {
    api: { bodyParser: false },
};

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const providedFilename = formData.get("filename") as string | null;

    if (!file || typeof file === "string") {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const ext = "." + (file.name.split(".").pop() || "jpg").toLowerCase();
    const baseFilename = providedFilename || `user-${randomUUID()}`;
    const fullFileName = `${baseFilename}${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    const filePath = path.join(uploadDir, fullFileName);

    await fs.mkdir(uploadDir, { recursive: true });

    // 💣 Delete old files with same base name but different extension
    for (const extension of allowedExtensions) {
        const altPath = path.join(uploadDir, `${baseFilename}${extension}`);
        if (altPath !== filePath) {
            try {
                await fs.unlink(altPath);
                console.log(`Deleted old image: ${altPath}`);
            } catch {
                // Ignore if file doesn't exist
            }
        }
    }

    // 📝 Save the new image
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ path: `/uploads/avatars/${fullFileName}` });
}
