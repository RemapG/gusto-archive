'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCoursePurchaseAction(courseId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;

    // Fetch the course and its recipes
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        recipes: true
      }
    });

    if (!course) {
      return { success: false, error: "Курс не найден" };
    }

    // Run in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create CoursePurchase
      await tx.coursePurchase.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        update: {},
        create: {
          userId,
          courseId
        }
      });

      // 2. Grant access to all linked recipes by creating Purchases
      for (const recipeRelation of course.recipes) {
        await tx.purchase.upsert({
          where: {
            userId_recipeId: {
              userId,
              recipeId: recipeRelation.recipeId
            }
          },
          update: {},
          create: {
            userId,
            recipeId: recipeRelation.recipeId
          }
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/cabinet");
    revalidatePath(`/course/${courseId}`);
    if (course.slug) {
      revalidatePath(`/course/${course.slug}`);
    }

    // Also revalidate each recipe page that was purchased
    for (const recipeRelation of course.recipes) {
      revalidatePath(`/recipe/${recipeRelation.recipeId}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in createCoursePurchaseAction:", err);
    return { success: false, error: err.message };
  }
}
