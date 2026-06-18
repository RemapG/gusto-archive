'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Action to retrieve admin stats and user profiles
export async function getAdminStatsAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для совершения этого действия" };
    }

    // Fetch all users with their purchases
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionExpiresAt: true,
        purchases: {
          include: {
            recipe: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { email: 'asc' }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email || "Без email",
      role: u.role,
      subscriptionExpiresAt: u.subscriptionExpiresAt ? u.subscriptionExpiresAt.toISOString() : null,
      purchasedRecipes: u.purchases.map(p => p.recipe.title)
    }));

    // General counts
    const totalRecipes = await prisma.recipe.count();
    const totalPurchases = await prisma.purchase.count();
    const totalCourses = await prisma.course.count();
    const totalCoursePurchases = await prisma.coursePurchase.count();
    const activeSubscriptions = users.filter(u => u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date()).length;

    // Fetch all courses for admin dashboard list
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lessons: { select: { id: true } }
      }
    });

    const formattedCourses = courses.map((c: any) => ({
      id: c.id,
      title: c.title,
      price: Number(c.price),
      slug: c.slug,
      imageUrl: c.imageUrl,
      lessonsCount: c.lessons.length
    }));

    return {
      success: true,
      users: formattedUsers,
      coursesList: formattedCourses,
      stats: {
        totalRecipes,
        totalPurchases,
        totalCourses,
        totalCoursePurchases,
        activeSubscriptions
      }
    };
  } catch (err: any) {
    console.error("Error in getAdminStatsAction:", err);
    return { success: false, error: "Ошибка на сервере: " + err.message };
  }
}

// Action to grant/revoke subscriptions
export async function grantSubscriptionAction(targetUserId: string, days: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для совершения этого действия" };
    }

    let expiresAt = null;
    if (days > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { subscriptionExpiresAt: expiresAt }
    });

    revalidatePath("/cabinet");
    return { success: true, expiresAt };
  } catch (err: any) {
    console.error("Error in grantSubscriptionAction:", err);
    return { success: false, error: "Ошибка при изменении подписки: " + err.message };
  }
}
