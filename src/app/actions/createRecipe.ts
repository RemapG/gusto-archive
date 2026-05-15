'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function createRecipeAction(
  recipeData: {
    title: string;
    category: string;
    description: string;
    price: number;
    image_url: string;
    ingredients: string[];
    steps: { text: string; image_url: string | null }[];
  },
  accessToken: string
) {
  try {
    // Initialize client with the user's access token to respect RLS
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    // 1. Insert into recipes
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        title: recipeData.title,
        category: recipeData.category,
        description: recipeData.description,
        price: recipeData.price,
        image_url: recipeData.image_url
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // 2. Insert into recipe_contents
    const { error: contentError } = await supabaseAdmin
      .from("recipe_contents")
      .insert({
        recipe_id: recipe.id,
        ingredients: recipeData.ingredients.filter(i => i.trim() !== ""),
        steps: recipeData.steps.filter(s => s.text.trim() !== "")
      });

    if (contentError) throw contentError;

    return { success: true, recipeId: recipe.id };
  } catch (err: any) {
    console.error('Error in createRecipeAction:', err);
    return { success: false, error: err.message };
  }
}
