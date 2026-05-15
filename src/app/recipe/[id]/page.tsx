import { prisma } from "@/lib/prisma";
import RecipeClient from "./RecipeClient";

export const revalidate = 0;

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  
  // Fetch the recipe metadata using Prisma
  const recipe = await prisma.recipe.findUnique({
    where: { id: unwrappedParams.id }
  });

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
    created_at: recipe.createdAt.toISOString()
  };

  return <RecipeClient initialRecipe={formattedRecipe} recipeId={unwrappedParams.id} />;
}
