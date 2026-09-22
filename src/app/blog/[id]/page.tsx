import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

export const revalidate = 0;

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idOrSlug = resolvedParams.id;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  let post = null;
  if (isUuid) {
    post = await prisma.post.findUnique({
      where: { id: idOrSlug },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            role: true
          }
        }
      }
    });
  }

  if (!post) {
    post = await prisma.post.findUnique({
      where: { slug: idOrSlug },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            role: true
          }
        }
      }
    });
  }

  if (!post) {
    notFound();
  }

  const formattedPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    imageUrl: post.imageUrl,
    images: (post.images as string[]) || [],
    placeName: post.placeName,
    rating: post.rating !== null ? Number(post.rating) : null,
    category: post.category || "Статья",
    createdAt: post.createdAt.toISOString(),
    author: {
      name: post.author.name || "Лидия",
      image: post.author.image,
      role: post.author.role
    }
  };

  return <BlogPostClient post={formattedPost} />;
}
