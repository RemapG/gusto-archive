import { prisma } from "@/lib/prisma";
import HomePageClient from "./HomePageClient";

// Opt out of caching so it always fetches fresh recipes on load
export const revalidate = 0;

export default async function Home() {
  // Fetch recipes on the server side using Prisma!
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // Map to the format the client expects if necessary
  const formattedRecipes = recipes.map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    price: Number(r.price),
    image_url: r.imageUrl,
    created_at: r.createdAt.toISOString()
  }));

  return <HomePageClient initialRecipes={formattedRecipes} />;
}
