import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditCourseClient from "./EditCourseClient";

export const revalidate = 0;

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    redirect("/cabinet");
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" }
      },
      recipes: true
    }
  });

  if (!course) {
    notFound();
  }

  // Load all recipes to let the admin select links
  const allRecipes = await prisma.recipe.findMany({
    select: {
      id: true,
      title: true,
      category: true
    },
    orderBy: {
      title: 'asc'
    }
  });

  const formattedCourse = {
    id: course.id,
    title: course.title,
    description: course.description || "",
    price: Number(course.price),
    imageUrl: course.imageUrl || "",
    slug: course.slug || "",
    lessons: course.lessons.map(l => ({
      title: l.title,
      description: l.description || "",
      videoUrl: l.videoUrl || ""
    })),
    recipeIds: course.recipes.map(r => r.recipeId)
  };

  const formattedRecipes = allRecipes.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category
  }));

  return <EditCourseClient course={formattedCourse} recipes={formattedRecipes} />;
}
