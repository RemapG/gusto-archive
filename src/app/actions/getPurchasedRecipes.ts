'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPurchasedRecipesAction() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;

    // Fetch purchases with recipe details
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true
          }
        }
      }
    });

    const recipes = purchases.map(p => ({
      id: p.recipe.id,
      title: p.recipe.title,
      category: p.recipe.category,
      image_url: p.recipe.imageUrl
    }));

    return { success: true, recipes };
  } catch (err) {
    console.error("Error in getPurchasedRecipesAction:", err);
    return { success: false, error: "Server Error" };
  }
}
