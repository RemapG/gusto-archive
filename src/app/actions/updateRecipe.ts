'use server'

import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateUniqueSlug } from "../../lib/slug";

export async function updateRecipeAction(
  recipeId: string,
  recipeData: {
    title: string;
    category: string;
    description: string;
    price: number;
    image_url: string;
    video_url?: string;
    available_in_subscription?: boolean;
    ingredients: string[];
    steps: { text: string; image_url: string | null; timer: number | null; video_url?: string | null }[];
  }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для редактирования рецептов" };
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { title: true, slug: true }
    });

    if (!existing) {
      return { success: false, error: "Рецепт не найден" };
    }

    let slug = existing.slug;
    if (!slug || existing.title !== recipeData.title) {
      slug = await generateUniqueSlug(recipeData.title, recipeId);
    }

    // Update the recipe and its content in a single transaction/operation
    await prisma.recipe.update({
      where: { id: recipeId },
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
          upsert: {
            create: {
              ingredients: recipeData.ingredients.filter(i => i && typeof i === 'string' && i.trim() !== ""),
              steps: recipeData.steps
                .filter(s => s && s.text && typeof s.text === 'string' && s.text.trim() !== "")
                .map(s => ({
                  text: s.text,
                  image_url: s.image_url,
                  timer: s.timer || null,
                  video_url: s.video_url || null
                }))
            },
            update: {
              ingredients: recipeData.ingredients.filter(i => i && typeof i === 'string' && i.trim() !== ""),
              steps: recipeData.steps
                .filter(s => s && s.text && typeof s.text === 'string' && s.text.trim() !== "")
                .map(s => ({
                  text: s.text,
                  image_url: s.image_url,
                  timer: s.timer || null,
                  video_url: s.video_url || null
                }))
            }
          }
        }
      }
    });

    revalidatePath("/");
    revalidatePath(`/recipe/${recipeId}`);

    return { success: true };
  } catch (err: any) {
    console.error('Error in updateRecipeAction (Prisma):', err);
    return { success: false, error: err.message };
  }
}
