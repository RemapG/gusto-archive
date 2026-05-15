'use server'

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email и пароль обязательны" };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: "Пользователь с таким email уже существует" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "user" // Default role
      }
    });

    return { success: true };
  } catch (err: any) {
    console.error("Registration Error:", err);
    return { success: false, error: "Ошибка при регистрации: " + err.message };
  }
}
