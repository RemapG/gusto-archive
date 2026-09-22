"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChefHat,
  Star,
  ArrowRight,
  MapPin,
  Calendar,
  PenSquare,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { createPostAction } from "@/app/actions/posts";
import { uploadToS3Action } from "@/app/actions/uploadToS3";

const PRESET_CATEGORIES = [
  "Обзор заведения",
  "Кулинарная статья",
  "Заметка от шефа",
  "Гастропутешествие",
  "Личное"
];

export default function BlogListClient({ initialPosts }: { initialPosts: any[] }) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");

  // Admin Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Обзор заведения");
  const [customCategory, setCustomCategory] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [rating, setRating] = useState<number | null>(5);
  const [content, setContent] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<{ file: File; preview: string }[]>([]);

  const role = (session?.user as any)?.role || "user";
  const isAdmin = role === "admin";

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["Все", ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "Все") return posts;
    return posts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, posts]);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setGalleryFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadToS3Action(formData);
    if (!result.success) {
      throw new Error(result.error || "Ошибка загрузки файла в хранилище");
    }
    return result.url!;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError("Укажите заголовок публикации");
      return;
    }
    if (!content.trim()) {
      setModalError("Напишите текст публикации");
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      // Upload main image if chosen
      let uploadedMainImageUrl: string | null = null;
      if (mainImageFile) {
        uploadedMainImageUrl = await uploadFile(mainImageFile);
      }

      // Upload gallery photos
      const uploadedGalleryUrls: string[] = [];
      for (const item of galleryFiles) {
        const url = await uploadFile(item.file);
        uploadedGalleryUrls.push(url);
      }

      const finalCategory =
        category === "Другое" ? (customCategory.trim() || "Статья") : category;

      const res = await createPostAction({
        title,
        slug: slug.trim() || undefined,
        category: finalCategory,
        placeName: placeName.trim() || undefined,
        rating: rating !== null ? Number(rating) : null,
        content,
        imageUrl: uploadedMainImageUrl,
        images: uploadedGalleryUrls.length > 0 ? uploadedGalleryUrls : undefined
      });

      if (res.success && res.post) {
        setPosts((prev) => [
          {
            ...res.post,
            author: {
              name: session?.user?.name || "Лидия",
              image: session?.user?.image,
              role: "admin"
            }
          },
          ...prev
        ]);

        // Reset form
        setTitle("");
        setSlug("");
        setCategory("Обзор заведения");
        setCustomCategory("");
        setPlaceName("");
        setRating(5);
        setContent("");
        setMainImageFile(null);
        setMainImagePreview(null);
        setGalleryFiles([]);
        setIsCreateModalOpen(false);
      } else {
        setModalError(res.error || "Не удалось сохранить публикацию");
      }
    } catch (err: any) {
      console.error("Error creating post modal:", err);
      setModalError(err.message || "Произошла ошибка при сохранении");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 md:px-16 w-full mx-auto flex justify-between items-center bg-[#fcfcf9] z-40 border-b border-[#f1f0e9] relative">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0">
          <ChefHat size={24} className="text-[#2d2c2a]" />
          <span className="font-serif italic text-xl md:text-2xl tracking-wide">В гостях у Лидии</span>
        </Link>

        {/* Center: Navigation Tabs (centered on desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-[#8a8883] absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="hover:text-[#2d2c2a] transition-colors">
            Каталог
          </Link>
          <Link href="/blog" className="text-[#2d2c2a] font-bold border-b-2 border-[#2d2c2a] pb-1">
            Блог
          </Link>
          <Link href="/about" className="hover:text-[#2d2c2a] transition-colors">
            Обо мне
          </Link>
          <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">
            Кабинет
          </Link>
        </nav>

        {/* Right side: Admin Action & Profile */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#2d2c2a] text-white hover:bg-black transition-all px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <PenSquare size={13} />
              <span>Написать</span>
            </button>
          )}

          {session?.user ? (
            <Link
              href="/cabinet"
              className="w-9 h-9 rounded-full bg-[#2d2c2a] text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
              title="Личный кабинет"
            >
              <User size={14} />
            </Link>
          ) : (
            <Link
              href="/auth"
              className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883] hover:text-[#2d2c2a] transition-colors ml-2"
            >
              Войти
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Nav bar (visible on mobile only) */}
      <div className="flex md:hidden items-center justify-center gap-6 py-3 px-4 border-b border-[#f1f0e9] bg-white text-[10px] uppercase tracking-widest font-medium text-[#8a8883]">
        <Link href="/" className="hover:text-[#2d2c2a] transition-colors">
          Каталог
        </Link>
        <Link href="/blog" className="text-[#2d2c2a] font-bold border-b-2 border-[#2d2c2a] pb-0.5">
          Блог
        </Link>
        <Link href="/about" className="hover:text-[#2d2c2a] transition-colors">
          Обо мне
        </Link>
        <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">
          Кабинет
        </Link>
      </div>

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

        {/* Admin Quick Action in Hero */}
        {isAdmin && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-white border border-[#e2e0d8] hover:border-[#2d2c2a] text-[#2d2c2a] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <PenSquare size={14} className="text-[#2d2c2a]" />
              <span>Написать новую запись</span>
            </button>
          </div>
        )}

        {/* Category Filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
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
            <p className="text-xs text-[#8a8883] uppercase tracking-wider leading-relaxed mb-6">
              Лидия скоро поделится первыми статьями и обзорами заведений. Загляните позже!
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#2d2c2a] text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer"
              >
                Создать первую запись
              </button>
            )}
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

      {/* Admin Post Creation Modal Window */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] border border-[#e2e0d8] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-8"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-[#f1f0e9] flex items-center justify-between bg-[#fcfcf9]">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#8a8883] block mb-1">
                    АДМИН-ПАНЕЛЬ • БЛОГ
                  </span>
                  <h3 className="text-2xl font-serif italic text-[#2d2c2a]">
                    Новая публикация
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white border border-[#e2e0d8] hover:bg-[#f6f5f0] text-[#8a8883] hover:text-[#2d2c2a] transition-colors flex items-center justify-center cursor-pointer"
                  title="Закрыть"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleCreatePost} className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                {modalError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                    {modalError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                    Заголовок публикации *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Обзор ресторана Harvest или секреты слоёного теста"
                    className="w-full px-4 py-3 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-sm transition-colors"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                    Категория
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESET_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          category === cat
                            ? "bg-[#2d2c2a] text-white"
                            : "bg-[#f6f5f0] text-[#8a8883] hover:text-[#2d2c2a] border border-[#e2e0d8]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCategory("Другое")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        category === "Другое"
                          ? "bg-[#2d2c2a] text-white"
                          : "bg-[#f6f5f0] text-[#8a8883] hover:text-[#2d2c2a] border border-[#e2e0d8]"
                      }`}
                    >
                      Другое
                    </button>
                  </div>
                  {category === "Другое" && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Введите свою категорию"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-xs mt-2"
                    />
                  )}
                </div>

                {/* Place Name & Star Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#fcfcf9] border border-[#f1f0e9]">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                      Заведение / Место
                    </label>
                    <input
                      type="text"
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      placeholder="Например: Harvest, СПб"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                      Оценка заведения
                    </label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            size={20}
                            className={`${
                              rating !== null && rating >= star
                                ? "fill-amber-400 text-amber-400"
                                : "text-[#e2e0d8]"
                            }`}
                          />
                        </button>
                      ))}

                      {rating !== null && (
                        <button
                          type="button"
                          onClick={() => setRating(null)}
                          className="text-[9px] text-[#8a8883] hover:text-red-500 uppercase tracking-wider ml-2 underline cursor-pointer"
                        >
                          Снять
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8a8883] mt-1 block">
                      {rating ? `Оценка: ${rating} из 5` : "Без оценки"}
                    </span>
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                    Главная обложка
                  </label>
                  <div className="flex items-center gap-4">
                    {mainImagePreview ? (
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#e2e0d8] bg-[#f6f5f0] shrink-0">
                        <Image
                          src={mainImagePreview}
                          alt="Обложка"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-20 rounded-xl border border-dashed border-[#e2e0d8] bg-[#fcfcf9] flex flex-col items-center justify-center text-[#8a8883] shrink-0">
                        <ImageIcon size={20} className="mb-1 text-[#8a8883]" />
                        <span className="text-[8px] uppercase tracking-wider">Нет фото</span>
                      </div>
                    )}

                    <div>
                      <label className="inline-block bg-[#2d2c2a] text-white hover:bg-black transition-colors px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest cursor-pointer">
                        {mainImagePreview ? "Заменить" : "Выбрать фото"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageChange}
                          className="hidden"
                        />
                      </label>
                      {mainImagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setMainImageFile(null);
                            setMainImagePreview(null);
                          }}
                          className="block text-[10px] text-red-500 hover:underline mt-1 cursor-pointer"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gallery Images */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold">
                      Галерея дополнительных фото ({galleryFiles.length})
                    </label>
                    <label className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#2d2c2a] hover:underline cursor-pointer">
                      <Plus size={12} /> Добавить фото
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryAdd}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {galleryFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {galleryFiles.map((item, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-[#e2e0d8] group"
                        >
                          <Image
                            src={item.preview}
                            alt={`Фото ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                    Текст записи *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Напишите вашу заметку, рецепт или подробный отзыв о блюдах..."
                    rows={8}
                    required
                    className="w-full p-4 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-sm leading-relaxed font-light transition-colors resize-y"
                  />
                </div>

                {/* Submit & Cancel */}
                <div className="pt-4 border-t border-[#f1f0e9] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-xs uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] font-semibold cursor-pointer"
                  >
                    Отмена
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#2d2c2a] text-white hover:bg-black disabled:opacity-50 transition-all px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md shadow-black/5 active:scale-95 cursor-pointer"
                  >
                    {submitting ? "Публикация..." : "Опубликовать"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
