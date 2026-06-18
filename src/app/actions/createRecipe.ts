'use server'

import { prisma } from "../../lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { generateUniqueSlug } from "../../lib/slug";

export async function createRecipeAction(
  recipeData: {
    title: string;
    category: string;
    description: string;
    price: number;
    image_url: string;
    video_url?: string;
    available_in_subscription?: boolean;
    ingredients: string[];
    steps: { text: string; image_url: string | null; video_url?: string | null }[];
  }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для создания рецептов" };
    }

    const slug = await generateUniqueSlug(recipeData.title);

    // 1. Insert into recipes and contents
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeData.title,
        category: recipeData.category,
        description: recipeData.description,
        price: recipeData.price,
        imageUrl: recipeData.image_url,
        videoUrl: recipeData.video_url || null,
        slug,
        availableInSubscription: recipeData.available_in_subscription !== false,
        contents: {
          create: {
            ingredients: recipeData.ingredients.filter(i => i && typeof i === 'string' && i.trim() !== ""),
            steps: recipeData.steps
              .filter(s => s && s.text && typeof s.text === 'string' && s.text.trim() !== "")
              .map(s => ({
                text: s.text,
                image_url: s.image_url,
                video_url: s.video_url || null
              }))
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
