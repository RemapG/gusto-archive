import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditRecipeClient from "./EditRecipeClient";

export const revalidate = 0;

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    redirect("/cabinet");
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      contents: true
    }
  });

  if (!recipe) {
    notFound();
  }

  const formattedRecipe = {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    description: recipe.description || "",
    price: Number(recipe.price),
    imageUrl: recipe.imageUrl || "",
    videoUrl: recipe.videoUrl || "",
    availableInSubscription: recipe.availableInSubscription,
    ingredients: (recipe.contents?.ingredients as string[]) || [],
    steps: (recipe.contents?.steps as any[]) || []
  };

  return <EditRecipeClient recipe={formattedRecipe} />;
}
