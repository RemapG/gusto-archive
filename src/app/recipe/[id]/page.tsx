import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export const revalidate = 0;

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  
  // Fetch the public recipe metadata on the server (Lightning fast, bypasses client ISP blocks)
  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", unwrappedParams.id)
    .single();

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] text-[#2d2c2a] flex items-center justify-center font-serif italic text-2xl">
        Рецепт не найден
      </div>
    );
  }

  return <RecipeClient initialRecipe={recipe} recipeId={unwrappedParams.id} />;
}
