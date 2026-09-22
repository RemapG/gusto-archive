'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateUniquePostSlug, slugify } from "@/lib/slug";

export interface PostInputData {
  title: string;
  slug?: string;
  content: string;
  imageUrl?: string | null;
  images?: string[];
  placeName?: string | null;
  rating?: number | null;
  category?: string | null;
}

export async function createPostAction(data: PostInputData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для публикации постов" };
    }

    if (!data.title?.trim()) {
      return { success: false, error: "Укажите заголовок публикации" };
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Текст публикации не может быть пустым" };
    }

    const userId = (session.user as any).id;

    let finalSlug: string;
    if (data.slug?.trim()) {
      const base = slugify(data.slug.trim());
      finalSlug = await generateUniquePostSlug(base);
    } else {
      finalSlug = await generateUniquePostSlug(data.title.trim());
    }

    const post = await prisma.post.create({
      data: {
        title: data.title.trim(),
        slug: finalSlug,
        content: data.content.trim(),
        imageUrl: data.imageUrl || null,
        images: data.images && data.images.length > 0 ? data.images : undefined,
        placeName: data.placeName?.trim() || null,
        rating: data.rating !== undefined && data.rating !== null && !isNaN(Number(data.rating)) ? Number(data.rating) : null,
        category: data.category?.trim() || "Статья",
        authorId: userId
      }
    });

    revalidatePath("/blog");
    revalidatePath("/cabinet");

    return { success: true, post: { ...post, createdAt: post.createdAt.toISOString() } };
  } catch (err: any) {
    console.error("Error creating post:", err);
    return { success: false, error: err.message || "Ошибка при создании публикации" };
  }
}

export async function updatePostAction(id: string, data: PostInputData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для редактирования постов" };
    }

    const existing = await prisma.post.findUnique({
      where: { id }
    });

    if (!existing) {
      return { success: false, error: "Публикация не найдена" };
    }

    let finalSlug = existing.slug;
    if (data.slug?.trim() && data.slug.trim() !== existing.slug) {
      const base = slugify(data.slug.trim());
      finalSlug = await generateUniquePostSlug(base, id);
    } else if (data.title.trim() !== existing.title && !existing.slug) {
      finalSlug = await generateUniquePostSlug(data.title.trim(), id);
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: data.title.trim(),
        slug: finalSlug,
        content: data.content.trim(),
        imageUrl: data.imageUrl !== undefined ? (data.imageUrl || null) : existing.imageUrl,
        images: data.images !== undefined ? data.images : undefined,
        placeName: data.placeName !== undefined ? (data.placeName?.trim() || null) : existing.placeName,
        rating: data.rating !== undefined ? (data.rating !== null && !isNaN(Number(data.rating)) ? Number(data.rating) : null) : existing.rating,
        category: data.category?.trim() || existing.category
      }
    });

    revalidatePath("/blog");
    if (post.slug) revalidatePath(`/blog/${post.slug}`);
    revalidatePath(`/blog/${post.id}`);
    revalidatePath("/cabinet");

    return { success: true, post: { ...post, createdAt: post.createdAt.toISOString() } };
  } catch (err: any) {
    console.error("Error updating post:", err);
    return { success: false, error: err.message || "Ошибка при обновлении публикации" };
  }
}

export async function deletePostAction(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для удаления постов" };
    }

    const post = await prisma.post.delete({
      where: { id }
    });

    revalidatePath("/blog");
    if (post.slug) revalidatePath(`/blog/${post.slug}`);
    revalidatePath(`/blog/${post.id}`);
    revalidatePath("/cabinet");

    return { success: true };
  } catch (err: any) {
    console.error("Error deleting post:", err);
    return { success: false, error: err.message || "Ошибка при удалении публикации" };
  }
}

export async function getPostsAction() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
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

    return {
      success: true,
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        content: p.content,
        imageUrl: p.imageUrl,
        images: (p.images as string[]) || [],
        placeName: p.placeName,
        rating: p.rating,
        category: p.category,
        createdAt: p.createdAt.toISOString(),
        author: {
          name: p.author.name || "Лидия",
          image: p.author.image,
          role: p.author.role
        }
      }))
    };
  } catch (err: any) {
    console.error("Error fetching posts:", err);
    return { success: false, error: err.message };
  }
}

export async function getPostByIdOrSlugAction(idOrSlug: string) {
  try {
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
      return { success: false, error: "Публикация не найдена" };
    }

    return {
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        imageUrl: post.imageUrl,
        images: (post.images as string[]) || [],
        placeName: post.placeName,
        rating: post.rating,
        category: post.category,
        createdAt: post.createdAt.toISOString(),
        author: {
          name: post.author.name || "Лидия",
          image: post.author.image,
          role: post.author.role
        }
      }
    };
  } catch (err: any) {
    console.error("Error fetching post:", err);
    return { success: false, error: err.message };
  }
}
