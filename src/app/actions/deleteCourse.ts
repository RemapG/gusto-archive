'use server'

import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteCourseAction(courseId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для удаления курсов" };
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });

    if (!course) {
      return { success: false, error: "Курс не найден" };
    }

    await prisma.course.delete({
      where: { id: courseId }
    });

    revalidatePath("/");
    revalidatePath("/cabinet");
    if (course.slug) {
      revalidatePath(`/course/${course.slug}`);
    }
    revalidatePath(`/course/${courseId}`);

    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteCourseAction:", err);
    return { success: false, error: err.message };
  }
}
