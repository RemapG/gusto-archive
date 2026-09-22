"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { updatePostAction } from "@/app/actions/posts";
import { uploadToS3Action } from "@/app/actions/uploadToS3";

const PRESET_CATEGORIES = [
  "Обзор заведения",
  "Кулинарная статья",
  "Заметка от шефа",
  "Гастропутешествие",
  "Личное"
];

export default function EditPostClient({ initialPost }: { initialPost: any }) {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fields
  const [title, setTitle] = useState(initialPost.title || "");
  const [slug, setSlug] = useState(initialPost.slug || "");
  
  const isPreset = PRESET_CATEGORIES.includes(initialPost.category);
  const [category, setCategory] = useState(isPreset ? initialPost.category : "Другое");
  const [customCategory, setCustomCategory] = useState(isPreset ? "" : initialPost.category);
  
  const [placeName, setPlaceName] = useState(initialPost.placeName || "");
  const [rating, setRating] = useState<number | null>(initialPost.rating);
  const [content, setContent] = useState(initialPost.content || "");

  // Main Image
  const [currentMainImageUrl, setCurrentMainImageUrl] = useState<string>(initialPost.imageUrl || "");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(initialPost.imageUrl || null);

  // Gallery
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>(initialPost.images || []);
  const [newGalleryFiles, setNewGalleryFiles] = useState<{ file: File; preview: string }[]>([]);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setNewGalleryFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeExistingGalleryImage = (index: number) => {
    setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewGalleryImage = (index: number) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadToS3Action(formData);
    if (!result.success) {
      throw new Error(result.error || "Ошибка загрузки файла в S3");
    }
    return result.url!;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Укажите заголовок публикации");
      return;
    }
    if (!content.trim()) {
      setError("Напишите текст публикации");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Upload main image if changed
      let finalMainImageUrl = currentMainImageUrl;
      if (mainImageFile) {
        finalMainImageUrl = await uploadFile(mainImageFile);
      }

      // Upload new gallery files
      const uploadedNewUrls: string[] = [];
      for (const item of newGalleryFiles) {
        const url = await uploadFile(item.file);
        uploadedNewUrls.push(url);
      }

      const allGalleryUrls = [...existingGalleryUrls, ...uploadedNewUrls];
      const finalCategory = category === "Другое" ? (customCategory.trim() || "Статья") : category;

      const res = await updatePostAction(initialPost.id, {
        title,
        slug: slug.trim() || undefined,
        category: finalCategory,
        placeName: placeName.trim() || undefined,
        rating: rating !== null ? Number(rating) : null,
        content,
        imageUrl: finalMainImageUrl || null,
        images: allGalleryUrls
      });

      if (res.success) {
        alert("Публикация успешно обновлена!");
        router.push("/cabinet");
        router.refresh();
      } else {
        setError(res.error || "Не удалось обновить публикацию");
      }
    } catch (err: any) {
      console.error("Update post error:", err);
      setError(err.message || "Произошла ошибка при сохранении");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans pb-32">
      {/* Header */}
      <header className="px-6 py-6 md:px-16 md:py-8 w-full max-w-[1200px] mx-auto flex justify-between items-center border-b border-[#f1f0e9]">
        <Link
          href="/cabinet"
          className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-semibold"
        >
          <ArrowLeft size={16} className="mr-2" />
          Назад в кабинет
        </Link>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#8a8883]">
          Редактирование
        </span>
      </header>

      {/* Main Form Content */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 pt-12">
        <div className="mb-10">
          <span className="text-[10px] text-[#8a8883] uppercase tracking-[0.3em] font-bold block mb-3">
            РЕДАКТИРОВАНИЕ ПУБЛИКАЦИИ
          </span>
          <h1 className="text-3xl md:text-5xl font-serif italic text-[#2d2c2a]">
            {initialPost.title}
          </h1>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Main Info */}
          <div className="bg-white p-8 rounded-[2rem] border border-[#e2e0d8] shadow-sm space-y-6">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#2d2c2a]">
              Основная информация
            </h2>

            {/* Title */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                Заголовок публикации *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-base transition-colors"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                Категория
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
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
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
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
                  className="w-full px-5 py-3 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-sm"
                />
              )}
            </div>

            {/* Place Name & Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-[#f1f0e9]">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                  Заведение / Место (необязательно)
                </label>
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Например: Harvest, Санкт-Петербург"
                  className="w-full px-5 py-3 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-sm"
                />
                <span className="text-[10px] text-[#8a8883] mt-1 block">
                  Заполните, если пишете отзыв о ресторане, кафе или локации
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                  Оценка заведения (звёзды)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`${star} из 5`}
                    >
                      <Star
                        size={24}
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
                      className="text-[10px] text-[#8a8883] hover:text-red-500 uppercase tracking-widest ml-3 underline"
                    >
                      Снять оценку
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#8a8883] mt-2 block">
                  {rating ? `Выбрана оценка: ${rating} из 5` : "Без оценки"}
                </span>
              </div>
            </div>

            {/* Custom URL slug */}
            <div className="pt-2 border-t border-[#f1f0e9]">
              <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                Слаг URL
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8a8883] font-mono">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="harvest-review"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Photos */}
          <div className="bg-white p-8 rounded-[2rem] border border-[#e2e0d8] shadow-sm space-y-6">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#2d2c2a]">
              Фотографии
            </h2>

            {/* Cover image */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold mb-2">
                Главная обложка публикации
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {mainImagePreview ? (
                  <div className="relative w-40 h-28 rounded-2xl overflow-hidden border border-[#e2e0d8] bg-[#f6f5f0]">
                    <Image
                      src={mainImagePreview}
                      alt="Обложка"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-28 rounded-2xl border border-dashed border-[#e2e0d8] bg-[#fcfcf9] flex flex-col items-center justify-center text-[#8a8883]">
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-[9px] uppercase tracking-wider">Нет фото</span>
                  </div>
                )}

                <div>
                  <label className="inline-block bg-[#2d2c2a] text-white hover:bg-black transition-colors px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer shadow-sm">
                    {mainImagePreview ? "Заменить обложку" : "Загрузить обложку"}
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
                        setCurrentMainImageUrl("");
                      }}
                      className="block text-[10px] text-red-500 hover:underline mt-2"
                    >
                      Удалить обложку
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery images */}
            <div className="pt-6 border-t border-[#f1f0e9]">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] font-semibold">
                  Дополнительные фото ({existingGalleryUrls.length + newGalleryFiles.length})
                </label>
                <label className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2d2c2a] hover:underline cursor-pointer">
                  <Plus size={14} /> Добавить фото
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryAdd}
                    className="hidden"
                  />
                </label>
              </div>

              {existingGalleryUrls.length === 0 && newGalleryFiles.length === 0 ? (
                <p className="text-xs text-[#8a8883] font-light italic">
                  Дополнительные фотографии не добавлены.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                  {/* Existing gallery */}
                  {existingGalleryUrls.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-[#e2e0d8] group"
                    >
                      <Image
                        src={url}
                        alt={`Галерея ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingGalleryImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить снимок"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* New gallery files */}
                  {newGalleryFiles.map((item, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-[#e2e0d8] group"
                    >
                      <Image
                        src={item.preview}
                        alt={`Новое фото ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewGalleryImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить снимок"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Content Editor */}
          <div className="bg-white p-8 rounded-[2rem] border border-[#e2e0d8] shadow-sm space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#2d2c2a]">
              Текст публикации *
            </h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              required
              className="w-full p-5 rounded-2xl bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none text-base leading-relaxed font-light transition-colors resize-y"
            />
          </div>

          {/* Submit bar */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/cabinet"
              className="text-xs font-semibold uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
            >
              Отмена
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#2d2c2a] text-white hover:bg-black disabled:opacity-50 transition-all px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-black/5 active:scale-95 cursor-pointer"
            >
              {submitting ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
