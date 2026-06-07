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

    // Fetch recipe metadata
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { availableInSubscription: true }
    });

    if (!recipe) {
      return { success: false, error: "Рецепт не найден" };
    }

    // Admin can see everything
    if (userRole === 'admin') {
      const content = await prisma.recipeContent.findUnique({
        where: { recipeId }
      });
      return { success: true, content, purchased: true, hasAccess: true };
    }

    // Check if purchased directly (lifetime access)
    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    if (purchase) {
      const content = await prisma.recipeContent.findUnique({
        where: { recipeId }
      });
      return { success: true, content, purchased: true, hasAccess: true };
    }

    // Check if subscription is active and recipe is available in subscription
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionExpiresAt: true }
    });

    const isSubscriptionActive = dbUser?.subscriptionExpiresAt 
      ? new Date(dbUser.subscriptionExpiresAt) > new Date()
      : false;

    if (recipe.availableInSubscription && isSubscriptionActive) {
      const content = await prisma.recipeContent.findUnique({
        where: { recipeId }
      });
      return { success: true, content, purchased: false, hasAccess: true };
    }

    // No access
    return { success: true, content: null, purchased: false, hasAccess: false };
  } catch (err) {
    console.error("Error in getRecipeContentAction:", err);
    return { success: false, error: "Server Error" };
  }
}
