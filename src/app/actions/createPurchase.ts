'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createPurchaseAction(recipeId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;

    // Create purchase in Prisma
    await prisma.purchase.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      },
      update: {}, // No-op if exists
      create: {
        userId,
        recipeId
      }
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error in createPurchaseAction:", err);
    return { success: false, error: err.message };
  }
}
