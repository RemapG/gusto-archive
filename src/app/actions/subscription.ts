'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function subscribeAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Не авторизован" };
    }

    const userId = (session.user as any).id;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionExpiresAt: expiresAt }
    });

    revalidatePath("/cabinet");
    return { success: true, expiresAt };
  } catch (err: any) {
    console.error("Error in subscribeAction:", err);
    return { success: false, error: err.message };
  }
}

export async function cancelSubscriptionAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Не авторизован" };
    }

    const userId = (session.user as any).id;

    // Instantly expire subscription (set to current time)
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionExpiresAt: new Date() }
    });

    revalidatePath("/cabinet");
    return { success: true };
  } catch (err: any) {
    console.error("Error in cancelSubscriptionAction:", err);
    return { success: false, error: err.message };
  }
}
