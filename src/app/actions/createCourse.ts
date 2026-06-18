'use server'

import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateUniqueCourseSlug } from "../../lib/slug";

export async function createCourseAction(
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
      return { success: false, error: "У вас нет прав для создания курсов" };
    }

    const slug = await generateUniqueCourseSlug(courseData.title);

    const course = await prisma.course.create({
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
    });

    revalidatePath("/");
    revalidatePath("/cabinet");

    return { success: true, courseId: course.id };
  } catch (err: any) {
    console.error('Error in createCourseAction:', err);
    return { success: false, error: err.message };
  }
}
