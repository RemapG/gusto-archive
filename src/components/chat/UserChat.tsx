'use client'

import { useState, useEffect, useRef } from "react";
import { Send, RefreshCw, MessageSquare } from "lucide-react";
import { getChatMessagesAction, sendChatMessageAction } from "@/app/actions/chat";

export default function UserChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getChatMessagesAction();
      if (res.success && res.messages) {
        // If there are unread messages sent by admin
        const unreadAdminMsg = res.messages.some(
          (m: any) => m.sender.role === 'admin' && m.isRead === false
        );
        if (unreadAdminMsg) {
          setHasNewMessage(true);
        }
        setMessages(res.messages);
        setError(null);
      } else {
        setError(res.error || "Не удалось загрузить сообщения");
      }
    } catch (err: any) {
      setError("Ошибка: " + err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Poll for new messages every 2 seconds
  useEffect(() => {
    loadMessages(true);
    const interval = setInterval(() => {
      loadMessages(false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of chat (internally only)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const res = await sendChatMessageAction(text);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setInputText("");
      } else {
        alert(res.error || "Не удалось отправить сообщение");
      }
    } catch (err: any) {
      alert("Ошибка отправки: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-[#e2e0d8] rounded-[2rem] overflow-hidden shadow-sm flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-8 py-5 border-b border-[#f1f0e9] flex justify-between items-center bg-[#fcfcf9]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#2d2c2a] flex items-center justify-center text-white">
            <MessageSquare size={14} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#2d2c2a] flex items-center gap-2">
              Чат с Лидией
              {hasNewMessage && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4f] inline-block shrink-0 animate-pulse" />
              )}
            </h3>
            <p className="text-[10px] text-[#8a8883] font-light">
              Задайте вопрос, и Лидия скоро ответит
            </p>
          </div>
        </div>
        <button
          onClick={() => loadMessages(false)}
          className="text-[#8a8883] hover:text-[#2d2c2a] transition-colors p-1"
          title="Обновить сообщения"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Messages area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcf9] custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-[#8a8883] animate-pulse">
            Загрузка переписки...
          </div>
        ) : error && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-red-500 mb-2">{error}</p>
            <button
              onClick={() => loadMessages(true)}
              className="text-[10px] uppercase tracking-widest font-medium underline"
            >
              Попробовать снова
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="font-serif italic text-lg text-[#8a8883] mb-2">Начните общение</p>
            <p className="text-[10px] uppercase tracking-wider text-[#8a8883] font-medium max-w-xs leading-relaxed">
              Напишите ваш первый вопрос ниже. Лидия увидит его в панели администратора.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.role !== "admin";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] px-5 py-3 rounded-[1.25rem] text-xs leading-relaxed ${
                    isMe
                      ? "bg-[#2d2c2a] text-white rounded-br-none"
                      : "bg-[#e8e6df] text-[#2d2c2a] rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[8px] uppercase tracking-wider text-[#8a8883] mt-1 px-1">
                  {isMe ? "Вы" : "Лидия"} • {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-[#f1f0e9] bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setHasNewMessage(false)}
          placeholder="Напишите сообщение..."
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
    </div>
  );
}
