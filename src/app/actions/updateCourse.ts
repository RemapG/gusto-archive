'use server'

import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateUniqueCourseSlug } from "../../lib/slug";

export async function updateCourseAction(
  courseId: string,
  courseData: {
    title: string;
    description: string;
    price: number;
    image_url: string;
    recipeIds: string[];
    lessons: { title: string; description: string; videoUrl: string }[];
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для редактирования курсов" };
    }

    const existing = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, slug: true }
    });

    if (!existing) {
      return { success: false, error: "Курс не найден" };
    }

    let slug = existing.slug;
    if (!slug || existing.title !== courseData.title) {
      slug = await generateUniqueCourseSlug(courseData.title, courseId);
    }

    // Run updates in a transaction
    await prisma.$transaction([
      prisma.lesson.deleteMany({
        where: { courseId }
      }),
      prisma.recipeInCourse.deleteMany({
        where: { courseId }
      }),
      prisma.course.update({
        where: { id: courseId },
        data: {
          title: courseData.title,
          description: courseData.description,
          price: courseData.price,
          imageUrl: courseData.image_url,
          slug,
          lessons: {
            create: courseData.lessons.map((lesson, idx) => ({
              title: lesson.title,
              description: lesson.description,
              videoUrl: lesson.videoUrl || null,
              order: idx
            }))
          },
          recipes: {
            create: courseData.recipeIds.map(recipeId => ({
              recipeId
            }))
          }
        }
      })
    ]);

    revalidatePath("/");
    revalidatePath("/cabinet");
    revalidatePath(`/course/${courseId}`);
    if (slug) revalidatePath(`/course/${slug}`);

    return { success: true };
  } catch (err: any) {
    console.error('Error in updateCourseAction:', err);
    return { success: false, error: err.message };
  }
}
