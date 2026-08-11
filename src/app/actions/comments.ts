'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCommentsAction(recipeId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      comments: comments.map(c => ({
        id: c.id,
        recipeId: c.recipeId,
        userId: c.userId,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        user: {
          id: c.user.id,
          name: c.user.name || "Пользователь",
          image: c.user.image,
          role: c.user.role
        }
      }))
    };
  } catch (err: any) {
    console.error("Error fetching comments:", err);
    return { success: false, error: err.message };
  }
}

export async function addCommentAction(recipeId: string, text: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Необходимо авторизоваться" };
    }

    const userId = (session.user as any).id;
    const trimmedText = text.trim();
    if (!trimmedText) {
      return { success: false, error: "Комментарий не может быть пустым" };
    }

    if (trimmedText.length > 1000) {
      return { success: false, error: "Комментарий слишком длинный (максимум 1000 символов)" };
    }

    const comment = await prisma.comment.create({
      data: {
        recipeId,
        userId,
        text: trimmedText
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        }
      }
    });

    revalidatePath(`/recipe/${recipeId}`);

    return {
      success: true,
      comment: {
        id: comment.id,
        recipeId: comment.recipeId,
        userId: comment.userId,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name || "Пользователь",
          image: comment.user.image,
          role: comment.user.role
        }
      }
    };
  } catch (err: any) {
    console.error("Error creating comment:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteCommentAction(commentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Необходимо авторизоваться" };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return { success: false, error: "Комментарий не найден" };
    }

    if (comment.userId !== userId && userRole !== "admin") {
      return { success: false, error: "У вас нет прав для удаления этого комментария" };
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    revalidatePath(`/recipe/${comment.recipeId}`);

    return { success: true };
  } catch (err: any) {
    console.error("Error deleting comment:", err);
    return { success: false, error: err.message };
  }
}
