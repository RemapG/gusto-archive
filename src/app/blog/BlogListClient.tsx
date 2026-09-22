"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChefHat, Star, ArrowRight, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function BlogListClient({ initialPosts }: { initialPosts: any[] }) {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialPosts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["Все", ...Array.from(set)];
  }, [initialPosts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "Все") return initialPosts;
    return initialPosts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, initialPosts]);

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 md:px-16 w-full mx-auto flex justify-between items-center bg-[#fcfcf9] z-50 border-b border-[#f1f0e9]">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ChefHat size={24} className="text-[#2d2c2a]" />
          <span className="font-serif italic text-xl md:text-2xl tracking-wide">В гостях у Лидии</span>
        </Link>

        <div className="flex items-center text-[10px] uppercase tracking-widest font-medium text-[#8a8883] gap-4 md:gap-8">
          <Link href="/" className="hover:text-[#2d2c2a] transition-colors">
            Каталог
          </Link>
          <Link href="/blog" className="text-[#2d2c2a] font-bold border-b border-[#2d2c2a] pb-0.5">
            Блог
          </Link>
          <Link href="/about" className="hover:text-[#2d2c2a] transition-colors">
            Обо мне
          </Link>
          <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">
            Кабинет
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-16 pt-16 md:pt-24 pb-12 max-w-[1300px] mx-auto w-full text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-[#8a8883] uppercase tracking-[0.3em] font-bold block mb-4"
        >
          ЗАПИСКИ ШЕФ-ПОВАРА • ОБЗОРЫ И СТАТЬИ
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-7xl font-serif italic tracking-tight mb-6 text-[#2d2c2a]"
        >
          Кулинарный дневник & обзоры
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base text-[#8a8883] font-light max-w-2xl mx-auto leading-relaxed"
        >
          Честные впечатления от ресторанов Петербурга и Москвы, профессиональные секреты,
          авторские мысли о сезонных продуктах и поиске идеального вкуса.
        </motion.p>

        {/* Category Filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
                  selectedCategory === cat
                    ? "bg-[#2d2c2a] text-white shadow-md shadow-black/5"
                    : "bg-white text-[#8a8883] hover:text-[#2d2c2a] border border-[#e2e0d8]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Posts Grid */}
      <section className="flex-1 px-6 md:px-16 py-10 max-w-[1300px] mx-auto w-full">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-[#e2e0d8] p-8 max-w-lg mx-auto">
            <ChefHat size={36} className="mx-auto mb-4 text-[#e2e0d8]" />
            <h3 className="font-serif italic text-2xl mb-2 text-[#2d2c2a]">Пока нет публикаций</h3>
            <p className="text-xs text-[#8a8883] uppercase tracking-wider leading-relaxed">
              Лидия скоро поделится первыми статьями и обзорами заведений. Загляните позже!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {filteredPosts.map((post, idx) => {
              const formattedDate = new Date(post.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric"
              });

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="group flex flex-col bg-white rounded-[2.5rem] border border-[#e2e0d8] overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-all"
                >
                  <Link href={`/blog/${post.slug || post.id}`} className="block relative aspect-[16/10] overflow-hidden bg-[#f6f5f0]">
                    <Image
                      src={post.imageUrl || "/chocolate.png"}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Rating Badge */}
                    {post.rating !== null && post.rating !== undefined && (
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 text-xs font-bold text-[#2d2c2a] border border-[#e2e0d8]">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{post.rating} / 5</span>
                      </div>
                    )}

                    {/* Category pill */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                      {post.category || "Статья"}
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Place Name and Date */}
                      <div className="flex items-center gap-3 text-[10px] text-[#8a8883] uppercase tracking-wider mb-3">
                        {post.placeName && (
                          <span className="flex items-center gap-1 font-semibold text-[#2d2c2a]">
                            <MapPin size={11} className="text-amber-600" />
                            {post.placeName}
                          </span>
                        )}
                        {post.placeName && <span>•</span>}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/blog/${post.slug || post.id}`}>
                        <h2 className="font-serif italic text-2xl mb-3 text-[#2d2c2a] group-hover:opacity-75 transition-opacity leading-snug">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Excerpt */}
                      <p className="text-xs text-[#8a8883] line-clamp-3 font-light leading-relaxed mb-6">
                        {post.content}
                      </p>
                    </div>

                    {/* Read Link */}
                    <div className="pt-4 border-t border-[#f1f0e9] flex items-center justify-between">
                      <span className="text-[10px] text-[#8a8883] uppercase tracking-widest font-medium">
                        Автор: {post.author?.name || "Лидия"}
                      </span>
                      <Link
                        href={`/blog/${post.slug || post.id}`}
                        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#2d2c2a] group-hover:translate-x-1 transition-transform"
                      >
                        Читать <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#e2e0d8] bg-[#f1f0e9] px-8 md:px-16 py-16">
        <div className="max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity mb-6">
              <ChefHat size={20} className="text-[#2d2c2a]" />
              <span className="font-serif italic text-lg">В гостях у Лидии</span>
            </Link>
            <p className="text-[10px] uppercase tracking-widest leading-loose text-[#8a8883] max-w-xs font-medium">
              ИСКЛЮЧИТЕЛЬНЫЕ КУЛИНАРНЫЕ<br />ТЕХНИЧЕСКИЕ ФАЙЛЫ И РЕСТОРАННЫЕ<br />ОБЗОРЫ ОТ ШЕФ-ПОВАРА.
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
