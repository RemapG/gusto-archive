import { prisma } from "@/lib/prisma";
import BlogListClient from "./BlogListClient";

export const revalidate = 0;

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
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

  const formattedPosts = posts.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    imageUrl: p.imageUrl,
    placeName: p.placeName,
    rating: p.rating !== null ? Number(p.rating) : null,
    category: p.category || "Статья",
    createdAt: p.createdAt.toISOString(),
    author: {
      name: p.author.name || "Лидия",
      image: p.author.image,
      role: p.author.role
    }
  }));

  return <BlogListClient initialPosts={formattedPosts} />;
}
