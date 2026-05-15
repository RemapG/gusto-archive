import { supabase } from "@/lib/supabase";
import HomePageClient from "./HomePageClient";

// Opt out of caching so it always fetches fresh recipes on load
export const revalidate = 0;

export default async function Home() {
  // Fetch recipes on the server side! This bypasses client-side network drops (ERR_CONNECTION_RESET)
  // and makes the initial page load lightning fast for the user.
  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: true });

  return <HomePageClient initialRecipes={recipes || []} />;
}
