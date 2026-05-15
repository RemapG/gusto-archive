'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function deleteRecipeAction(recipeId: string, accessToken: string) {
  try {
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    // 1. Delete from recipe_contents (though ON DELETE CASCADE should handle it)
    const { error: contentError } = await supabase
      .from('recipe_contents')
      .delete()
      .eq('recipe_id', recipeId)

    if (contentError) throw contentError;

    // 2. Delete from recipes
    const { error: recipeError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)

    if (recipeError) throw recipeError;

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteRecipeAction:', err);
    return { success: false, error: err.message };
  }
}
