import { prisma } from "@/lib/prisma";
import HomePageClient from "./HomePageClient";

// Opt out of caching so it always fetches fresh recipes on load
export const revalidate = 0;

export default async function Home() {
  // Fetch recipes on the server side using Prisma!
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // Fetch courses on the server side using Prisma!
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      lessons: {
        select: { id: true }
      }
    }
  });

  // Map to the format the client expects if necessary
  const formattedRecipes = recipes.map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    price: Number(r.price),
    image_url: r.imageUrl,
    slug: r.slug,
    created_at: r.createdAt.toISOString()
  }));

  const formattedCourses = courses.map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    price: Number(c.price),
    image_url: c.imageUrl,
    slug: c.slug,
    lessons_count: c.lessons.length,
    created_at: c.createdAt.toISOString()
  }));

  return <HomePageClient initialRecipes={formattedRecipes} initialCourses={formattedCourses} />;
}
