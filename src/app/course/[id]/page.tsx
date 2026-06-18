import { prisma } from "@/lib/prisma";
import CourseClient from "./CourseClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 0;

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const idOrSlug = unwrappedParams.id;

  // Safe UUID format check
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  let course = null;
  if (isUuid) {
    course = await prisma.course.findUnique({
      where: { id: idOrSlug },
      include: {
        lessons: {
          orderBy: { order: "asc" }
        },
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                category: true,
                slug: true
              }
            }
          }
        }
      }
    });
  }

  if (!course) {
    course = await prisma.course.findUnique({
      where: { slug: idOrSlug },
      include: {
        lessons: {
          orderBy: { order: "asc" }
        },
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                category: true,
                slug: true
              }
            }
          }
        }
      }
    });
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] text-[#2d2c2a] flex items-center justify-center font-serif italic text-2xl">
        Курс не найден
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : null;
  const userRole = session?.user ? (session.user as any).role : "user";

  let hasAccess = false;
  if (userRole === "admin") {
    hasAccess = true;
  } else if (userId) {
    const purchase = await prisma.coursePurchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id
        }
      }
    });
    if (purchase) {
      hasAccess = true;
    }
  }

  const formattedCourse = {
    id: course.id,
    title: course.title,
    description: course.description || "",
    price: Number(course.price),
    imageUrl: course.imageUrl || "",
    slug: course.slug || "",
    lessons: course.lessons.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description || "",
      videoUrl: l.videoUrl || "",
      order: l.order
    })),
    recipes: course.recipes.map(r => ({
      id: r.recipe.id,
      title: r.recipe.title,
      category: r.recipe.category,
      slug: r.recipe.slug
    }))
  };

  return <CourseClient initialCourse={formattedCourse} courseId={course.id} initialHasAccess={hasAccess} />;
}
