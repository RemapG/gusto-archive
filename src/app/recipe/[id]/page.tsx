import { prisma } from "@/lib/prisma";
import RecipeClient from "./RecipeClient";

export const revalidate = 0;

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const idOrSlug = unwrappedParams.id;
  
  // Safe UUID format check (database will error if we search non-uuid string in UUID column)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  let recipe = null;
  if (isUuid) {
    recipe = await prisma.recipe.findUnique({
      where: { id: idOrSlug }
    });
  }

  if (!recipe) {
    recipe = await prisma.recipe.findUnique({
      where: { slug: idOrSlug }
    });
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] text-[#2d2c2a] flex items-center justify-center font-serif italic text-2xl">
        Рецепт не найден
      </div>
    );
  }

  const formattedRecipe = {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    description: recipe.description,
    price: Number(recipe.price),
    image_url: recipe.imageUrl,
    video_url: recipe.videoUrl || "",
    created_at: recipe.createdAt.toISOString()
  };

  return <RecipeClient initialRecipe={formattedRecipe} recipeId={recipe.id} />;
}
