'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Retrieve messages for a specific user thread (or own thread if not admin)
export async function getChatMessagesAction(targetUserId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Вы не авторизованы" };
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;

    let userId = currentUserId;

    if (currentUserRole === 'admin') {
      if (!targetUserId) {
        return { success: false, error: "Не указан пользователь для просмотра чата" };
      }
      userId = targetUserId;
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        text: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Mark messages as read in database
    if (currentUserRole === 'admin') {
      await prisma.chatMessage.updateMany({
        where: {
          userId: targetUserId,
          senderId: targetUserId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } else {
      await prisma.chatMessage.updateMany({
        where: {
          userId: currentUserId,
          senderId: { not: currentUserId },
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }

    return {
      success: true,
      messages: messages.map(m => ({
        id: m.id,
        text: m.text,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        sender: {
          id: m.sender.id,
          name: m.sender.name || m.sender.email || "Пользователь",
          role: m.sender.role,
        }
      }))
    };
  } catch (err: any) {
    console.error("Error in getChatMessagesAction:", err);
    return { success: false, error: "Ошибка при загрузке сообщений: " + err.message };
  }
}

// Send a chat message
export async function sendChatMessageAction(text: string, targetUserId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Вы не авторизованы" };
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return { success: false, error: "Сообщение не может быть пустым" };
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;

    let userId = currentUserId;

    if (currentUserRole === 'admin') {
      if (!targetUserId) {
        return { success: false, error: "Не указан получатель сообщения" };
      }
      userId = targetUserId;
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        userId,
        senderId: currentUserId,
        text: trimmedText,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        senderId: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    revalidatePath("/cabinet");

    return {
      success: true,
      message: {
        id: newMessage.id,
        text: newMessage.text,
        createdAt: newMessage.createdAt.toISOString(),
        senderId: newMessage.senderId,
        sender: {
          id: newMessage.sender.id,
          name: newMessage.sender.name || newMessage.sender.email || "Пользователь",
          role: newMessage.sender.role,
        }
      }
    };
  } catch (err: any) {
    console.error("Error in sendChatMessageAction:", err);
    return { success: false, error: "Ошибка при отправке сообщения: " + err.message };
  }
}

// Retrieve list of all chat rooms/users who have interactive chats (admin only)
export async function getAdminChatsAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return { success: false, error: "У вас нет прав для совершения этого действия" };
    }

    // Fetch users who have sent/received messages
    const users = await prisma.user.findMany({
      where: {
        chatMessages: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            text: true,
            createdAt: true,
            senderId: true,
          }
        }
      }
    });

    const formattedChats = await Promise.all(users.map(async (u) => {
      const lastMsg = u.chatMessages[0];
      
      const unreadCount = await prisma.chatMessage.count({
        where: {
          userId: u.id,
          senderId: u.id,
          isRead: false,
        }
      });

      return {
        userId: u.id,
        userName: u.name || u.email || "Пользователь",
        userEmail: u.email || "",
        unreadCount,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              text: lastMsg.text,
              createdAt: lastMsg.createdAt.toISOString(),
              senderId: lastMsg.senderId,
            }
          : null,
      };
    }));

    // Sort by the latest message time descending
    formattedChats.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return { success: true, chats: formattedChats };
  } catch (err: any) {
    console.error("Error in getAdminChatsAction:", err);
    return { success: false, error: "Ошибка при загрузке чатов: " + err.message };
  }
}

// Get count of unread messages for the current user
export async function getUnreadMessagesCountAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: true, count: 0 };
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;

    if (currentUserRole === 'admin') {
      // For admin, count all unread messages sent by users
      const count = await prisma.chatMessage.count({
        where: {
          senderId: { not: currentUserId },
          isRead: false
        }
      });
      return { success: true, count };
    } else {
      // For regular user, count unread messages in their thread sent by admin
      const count = await prisma.chatMessage.count({
        where: {
          userId: currentUserId,
          senderId: { not: currentUserId },
          isRead: false
        }
      });
      return { success: true, count };
    }
  } catch (err: any) {
    console.error("Error in getUnreadMessagesCountAction:", err);
    return { success: false, error: err.message, count: 0 };
  }
}
