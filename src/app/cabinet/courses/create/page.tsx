import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CreateCourseClient from "./CreateCourseClient";

export const revalidate = 0;

export default async function CreateCoursePage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    redirect("/cabinet");
  }

  // Fetch all recipes to let the admin select which ones are bundled with this course
  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      title: true,
      category: true
    },
    orderBy: {
      title: 'asc'
    }
  });

  const formattedRecipes = recipes.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category
  }));

  return <CreateCourseClient recipes={formattedRecipes} />;
}
