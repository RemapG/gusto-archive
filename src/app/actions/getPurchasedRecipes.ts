'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPurchasedRecipesAction() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;

    // Fetch purchases with recipe details
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true,
            slug: true
          }
        }
      }
    });

    const recipes = purchases.map((p: any) => ({
      id: p.recipe.id,
      title: p.recipe.title,
      category: p.recipe.category,
      image_url: p.recipe.imageUrl,
      slug: p.recipe.slug
    }));

    // Fetch purchased courses
    const coursePurchases = await prisma.coursePurchase.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        course: {
          include: {
            lessons: { select: { id: true } }
          }
        }
      }
    });

    const courses = coursePurchases.map((cp: any) => ({
      id: cp.course.id,
      title: cp.course.title,
      image_url: cp.course.imageUrl,
      slug: cp.course.slug,
      lessons_count: cp.course.lessons.length,
      price: Number(cp.course.price)
    }));

    // Fetch user subscription info
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionExpiresAt: true }
    });

    return { 
      success: true, 
      recipes, 
      courses,
      subscriptionExpiresAt: dbUser?.subscriptionExpiresAt ? dbUser.subscriptionExpiresAt.toISOString() : null 
    };
  } catch (err) {
    console.error("Error in getPurchasedRecipesAction:", err);
    return { success: false, error: "Server Error" };
  }
}
