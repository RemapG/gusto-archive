"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MapPin, Calendar, Edit2, Trash2, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { deletePostAction } from "@/app/actions/posts";

export default function BlogPostClient({ post }: { post: any }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const role = (session?.user as any)?.role || "user";

  const formattedDate = new Date(post.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту публикацию?")) return;

    try {
      setIsDeleting(true);
      const res = await deletePostAction(post.id);
      if (res.success) {
        alert("Публикация удалена");
        router.push("/blog");
      } else {
        alert("Ошибка: " + res.error);
        setIsDeleting(false);
      }
    } catch (err: any) {
      alert("Ошибка: " + err.message);
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans pb-32">
      {/* Top Header */}
      <header className="px-6 py-5 md:px-16 md:py-6 w-full max-w-[1200px] mx-auto flex justify-between items-center border-b border-[#f1f0e9]">
        <Link
          href="/blog"
          className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-semibold"
        >
          <ArrowLeft size={16} className="mr-2" />
          Все публикации
        </Link>

        {role === "admin" && (
          <div className="flex items-center gap-4">
            <Link
              href={`/cabinet/posts/edit/${post.id}`}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
            >
              <Edit2 size={12} />
              <span>Редактировать</span>
            </Link>
            <div className="w-[1px] h-3 bg-[#e2e0d8]" />
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? "Удаление..." : "Удалить"}</span>
            </button>
          </div>
        )}
      </header>

      {/* Article Container */}
      <article className="max-w-[840px] mx-auto px-6 md:px-8 pt-12 md:pt-16">
        {/* Meta Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 text-[10px] text-[#8a8883] uppercase tracking-[0.25em] font-semibold mb-4">
            <span className="bg-[#f6f5f0] border border-[#e2e0d8] px-3 py-1 rounded-full text-[#2d2c2a]">
              {post.category || "Статья"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formattedDate}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif italic tracking-tight leading-[1.15] text-[#2d2c2a] mb-6">
            {post.title}
          </h1>

          {/* Place & Rating Highlight Card */}
          {(post.placeName || post.rating !== null) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-white border border-[#e2e0d8] px-8 py-5 rounded-[2rem] shadow-sm mt-4 text-left"
            >
              {post.placeName && (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#8a8883] font-bold block">
                      Заведение
                    </span>
                    <span className="text-sm font-semibold text-[#2d2c2a]">
                      {post.placeName}
                    </span>
                  </div>
                </div>
              )}

              {post.placeName && post.rating !== null && (
                <div className="hidden sm:block w-[1px] h-8 bg-[#e2e0d8]" />
              )}

              {post.rating !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        className={`${
                          post.rating >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-[#e2e0d8]"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#2d2c2a] leading-none">
                      {post.rating} / 5
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-[#8a8883] mt-0.5">
                      Оценка шефа
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Main Cover Image */}
        {post.imageUrl && (
          <div className="relative w-full aspect-[16/10] rounded-[2.5rem] overflow-hidden border border-[#e2e0d8] shadow-xl shadow-black/5 mb-14 bg-[#f6f5f0]">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Main Content Body */}
        <div className="prose max-w-none text-[#2d2c2a] font-light text-base md:text-lg leading-relaxed md:leading-[1.8] space-y-6">
          {post.content.split("\n\n").map((paragraph: string, idx: number) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            // Check if paragraph starts with a quote mark
            const isQuote = trimmed.startsWith("«") || trimmed.startsWith('"');

            if (isQuote) {
              return (
                <blockquote
                  key={idx}
                  className="pl-6 border-l-2 border-[#2d2c2a] font-serif italic text-xl md:text-2xl text-[#2d2c2a] my-8 py-1"
                >
                  {trimmed}
                </blockquote>
              );
            }

            return (
              <p key={idx} className="whitespace-pre-line">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Additional Gallery Photos */}
        {post.images && post.images.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#f1f0e9]">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8a8883] mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#e2e0d8]" />
              Галерея снимков
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {post.images.map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-[#e2e0d8] bg-[#f6f5f0] shadow-md shadow-black/5 hover:scale-[1.02] transition-transform duration-500"
                >
                  <Image
                    src={imgUrl}
                    alt={`Фото к публикации ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author Card */}
        <div className="mt-20 pt-10 border-t border-[#e2e0d8] flex flex-col sm:flex-row items-center gap-6 bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#f6f5f0] border border-[#e2e0d8] flex items-center justify-center text-[#2d2c2a] overflow-hidden shrink-0">
            {post.author?.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <ChefHat size={32} />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#8a8883] block mb-1">
              Автор материала
            </span>
            <h4 className="font-serif italic text-2xl text-[#2d2c2a] mb-1">
              {post.author?.name || "Лидия"}
            </h4>
            <p className="text-xs text-[#8a8883] font-light leading-relaxed">
              Шеф-повар, исследователь сезонных вкусов и создатель кулинарного архива «В гостях у Лидии».
            </p>
          </div>
          <Link
            href="/about"
            className="text-[10px] uppercase tracking-widest font-bold text-[#2d2c2a] hover:underline whitespace-nowrap px-4 py-2 rounded-full border border-[#e2e0d8] hover:bg-[#f6f5f0] transition-colors"
          >
            О шефе
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
          >
            <ArrowLeft size={14} /> Вернуться к списку статей
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#e2e0d8] bg-[#f1f0e9] px-8 md:px-16 py-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity mb-6">
              <ChefHat size={20} className="text-[#2d2c2a]" />
              <span className="font-serif italic text-lg">В гостях у Лидии</span>
            </Link>
            <p className="text-[10px] uppercase tracking-widest leading-loose text-[#8a8883] max-w-xs font-medium">
              ИСКЛЮЧИТЕЛЬНЫЕ КУЛИНАРНЫЕ<br />ТЕХНИЧЕСКИЕ ФАЙЛЫ ДЛЯ СОВРЕМЕННОГО<br />ПРИГОТОВЛЕНИЯ ЕДЫ.
            </p>
          </div>

          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-[#8a8883]">
            <span className="text-[10px] text-border mb-2 text-[#2d2c2a]">НАВИГАЦИЯ</span>
            <Link href="/" className="hover:text-[#2d2c2a] transition-colors">Каталог</Link>
            <Link href="/blog" className="hover:text-[#2d2c2a] transition-colors">Блог</Link>
            <Link href="/about" className="hover:text-[#2d2c2a] transition-colors">Обо мне</Link>
            <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">Кабинет</Link>
          </div>

          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-[#8a8883]">
            <span className="text-[10px] text-border mb-2 text-[#2d2c2a]">СВЯЗЬ</span>
            <p className="text-xs lowercase text-[#8a8883] font-mono">welcome@lidiya-boutique.ru</p>
            <p className="text-[10px] text-[#8a8883] uppercase tracking-wider">Санкт-Петербург, Россия</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
