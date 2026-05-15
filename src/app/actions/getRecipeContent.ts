'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getRecipeContentAction(recipeId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Admin can see everything
    if (userRole === 'admin') {
      const content = await prisma.recipeContent.findUnique({
        where: { recipeId }
      });
      return { success: true, content, purchased: true };
    }

    // Check if purchased
    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    if (!purchase) {
      return { success: true, content: null, purchased: false };
    }

    // If purchased, return content
    const content = await prisma.recipeContent.findUnique({
      where: { recipeId }
    });

    return { success: true, content, purchased: true };
  } catch (err) {
    console.error("Error in getRecipeContentAction:", err);
    return { success: false, error: "Server Error" };
  }
}
