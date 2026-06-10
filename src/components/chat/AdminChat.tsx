'use client'

import { useState, useEffect, useRef } from "react";
import { Send, RefreshCw, MessageSquare, User } from "lucide-react";
import { getAdminChatsAction, getChatMessagesAction, sendChatMessageAction } from "@/app/actions/chat";

export default function AdminChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const loadChats = async (showLoading = false) => {
    if (showLoading) setLoadingChats(true);
    try {
      const res = await getAdminChatsAction();
      if (res.success && res.chats) {
        setChats(res.chats);
        setError(null);
      } else {
        setError(res.error || "Не удалось загрузить список чатов");
      }
    } catch (err: any) {
      setError("Ошибка: " + err.message);
    } finally {
      if (showLoading) setLoadingChats(false);
    }
  };

  const loadMessages = async (userId: string, showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await getChatMessagesAction(userId);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (err: any) {
      console.error("Failed to load messages:", err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Poll chats list and active messages every 2 seconds
  useEffect(() => {
    loadChats(true);
    const interval = setInterval(() => {
      loadChats(false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedUserId, true);

    const interval = setInterval(() => {
      loadMessages(selectedUserId, false);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedUserId]);

  // Auto-scroll messages (internally only)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedUserId || sending) return;

    try {
      setSending(true);
      const res = await sendChatMessageAction(text, selectedUserId);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setInputText("");
        // Instantly refresh user list to update last message preview
        loadChats(false);
      } else {
        alert(res.error || "Не удалось отправить сообщение");
      }
    } catch (err: any) {
      alert("Ошибка отправки: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const activeChat = chats.find((c) => c.userId === selectedUserId);

  return (
    <div className="bg-white border border-[#e2e0d8] rounded-[2rem] overflow-hidden shadow-sm flex h-[600px]">
      {/* Left panel - User chats list */}
      <div className="w-1/3 border-r border-[#f1f0e9] flex flex-col bg-[#fcfcf9]">
        <div className="px-6 py-5 border-b border-[#f1f0e9] flex justify-between items-center bg-white">
          <h3 className="text-xs uppercase tracking-widest font-bold text-[#2d2c2a]">
            Вопросы пользователей
          </h3>
          <button
            onClick={() => loadChats(false)}
            className="text-[#8a8883] hover:text-[#2d2c2a] transition-colors p-1"
            title="Обновить список"
          >
            <RefreshCw size={14} className={loadingChats ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#f1f0e9] custom-scrollbar">
          {loadingChats && chats.length === 0 ? (
            <div className="py-12 text-center text-[10px] uppercase tracking-widest text-[#8a8883] animate-pulse">
              Загрузка...
            </div>
          ) : error && chats.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[10px] text-red-500 mb-2">{error}</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="py-24 text-center px-4">
              <p className="font-serif italic text-base text-[#8a8883] mb-1">Сообщений нет</p>
              <p className="text-[9px] uppercase tracking-wider text-[#8a8883] leading-relaxed">
                Пользователи пока не задавали вопросов.
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const isSelected = chat.userId === selectedUserId;
              const hasLastMsg = !!chat.lastMessage;
              const timeString = hasLastMsg
                ? new Date(chat.lastMessage.createdAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              const lastMsgIsAdmin = hasLastMsg && chat.lastMessage.senderId !== chat.userId;

              return (
                <button
                  key={chat.userId}
                  onClick={() => setSelectedUserId(chat.userId)}
                  className={`w-full text-left p-5 transition-colors flex flex-col gap-1.5 relative ${
                    isSelected ? "bg-[#f6f5f0]" : "hover:bg-[#fcfcf9] bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-2 truncate max-w-[70%]">
                      <span className="font-sans text-xs font-bold text-[#2d2c2a] truncate">
                        {chat.userName}
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4f] inline-block shrink-0 animate-pulse" />
                      )}
                    </div>
                    {timeString && (
                      <span className="text-[9px] uppercase text-[#8a8883] font-medium font-mono">
                        {timeString}
                      </span>
                    )}
                  </div>
                  {chat.userEmail && chat.userEmail !== chat.userName && (
                    <span className="text-[9px] text-[#8a8883] font-mono truncate w-full block">
                      {chat.userEmail}
                    </span>
                  )}
                  {hasLastMsg && (
                    <div className="flex justify-between items-center w-full gap-2 mt-0.5">
                      <p className={`text-[11px] truncate flex-1 font-light ${
                        chat.unreadCount > 0 ? "text-[#2d2c2a] font-semibold" : "text-[#8a8883]"
                      }`}>
                        {lastMsgIsAdmin ? <span className="font-semibold text-[#2d2c2a]">Вы: </span> : ""}
                        {chat.lastMessage.text}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-[#ff4d4f] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[14px] text-center shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel - Current conversation thread */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUserId ? (
          <>
            {/* Active chat header */}
            <div className="px-8 py-5 border-b border-[#f1f0e9] flex justify-between items-center bg-[#fcfcf9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f6f5f0] border border-[#e2e0d8] flex items-center justify-center text-[#2d2c2a]">
                  <User size={14} />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#2d2c2a]">
                    {activeChat?.userName}
                  </h3>
                  <p className="text-[10px] text-[#8a8883] font-light">
                    Переписка с пользователем
                  </p>
                </div>
              </div>
            </div>

            {/* Messages body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcf9] custom-scrollbar">
              {loadingMessages && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-[#8a8883] animate-pulse">
                  Загрузка сообщений...
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.senderId === selectedUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[75%] px-5 py-3 rounded-[1.25rem] text-xs leading-relaxed ${
                          isUser
                            ? "bg-[#e8e6df] text-[#2d2c2a] rounded-bl-none"
                            : "bg-[#2d2c2a] text-white rounded-br-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-[#8a8883] mt-1 px-1">
                        {isUser ? activeChat?.userName : "Вы (Администратор)"} •{" "}
                        {new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-[#f1f0e9] bg-white flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Напишите ответ..."
                className="flex-1 px-4 py-3 rounded-full bg-[#f6f5f0] border-0 text-xs focus:ring-1 focus:ring-[#2d2c2a] outline-none text-[#2d2c2a]"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#2d2c2a] hover:bg-black text-white flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Send size={14} className={sending ? "animate-pulse" : ""} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fcfcf9]">
            <MessageSquare size={36} className="text-[#e2e0d8] mb-4" strokeWidth={1.5} />
            <h3 className="font-serif italic text-xl text-[#8a8883] mb-2">Выберите диалог</h3>
            <p className="text-[10px] uppercase tracking-wider text-[#8a8883] font-medium max-w-xs leading-relaxed">
              Нажмите на пользователя в левой панели, чтобы открыть чат с ним.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
