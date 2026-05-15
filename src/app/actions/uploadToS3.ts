'use server'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "ru-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

export async function uploadToS3Action(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "No file provided" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read" as any,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const endpointHost = process.env.S3_ENDPOINT?.replace("https://", "");
    const publicUrl = `https://${process.env.S3_BUCKET_NAME}.${endpointHost}/${fileName}`;

    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error("S3 Upload Error:", err);
    return { success: false, error: err.message };
  }
}
