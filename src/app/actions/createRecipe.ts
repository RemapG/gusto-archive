'use server'

import { prisma } from "../../lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createRecipeAction(
  recipeData: {
    title: string;
    category: string;
    description: string;
    price: number;
    image_url: string;
    ingredients: string[];
    steps: { text: string; image_url: string | null }[];
  }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для создания рецептов" };
    }

    // 1. Insert into recipes and contents
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeData.title,
        category: recipeData.category,
        description: recipeData.description,
        price: recipeData.price,
        imageUrl: recipeData.image_url,
        contents: {
          create: {
            ingredients: recipeData.ingredients.filter(i => i.trim() !== ""),
            steps: recipeData.steps.filter(s => s.text.trim() !== "")
          }
        }
      }
    });

    revalidatePath("/");

    return { success: true, recipeId: recipe.id };
  } catch (err: any) {
    console.error('Error in createRecipeAction (Prisma):', err);
    return { success: false, error: err.message };
  }
}
