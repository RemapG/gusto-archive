'use server'

import { prisma } from "../../lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteRecipeAction(recipeId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    // Authorization check
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для удаления этого рецепта" };
    }

    // 1. Delete associated contents first (Prisma doesn't do cascade automatically if not defined in schema)
    await prisma.recipeContent.deleteMany({
      where: { recipeId }
    });

    // 2. Delete associated purchases
    await prisma.purchase.deleteMany({
      where: { recipeId }
    });

    // 3. Finally delete the recipe itself
    await prisma.recipe.delete({
      where: { id: recipeId }
    });

    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteRecipeAction (Prisma):', err);
    return { success: false, error: err.message };
  }
}
