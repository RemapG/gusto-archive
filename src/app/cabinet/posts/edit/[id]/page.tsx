import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditPostClient from "./EditPostClient";

export const revalidate = 0;

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    redirect("/cabinet");
  }

  const post = await prisma.post.findUnique({
    where: { id }
  });

  if (!post) {
    notFound();
  }

  const formattedPost = {
    id: post.id,
    title: post.title,
    slug: post.slug || "",
    category: post.category || "Обзор заведения",
    placeName: post.placeName || "",
    rating: post.rating !== null ? Number(post.rating) : null,
    content: post.content,
    imageUrl: post.imageUrl || "",
    images: (post.images as string[]) || []
  };

  return <EditPostClient initialPost={formattedPost} />;
}
