'use server'

import { prisma } from "../../lib/prisma";

export async function getUserRole(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    return user?.role || 'user';
  } catch (err) {
    console.error('Server Action Error (getRole):', err);
    return 'user';
  }
}
