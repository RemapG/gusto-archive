"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Upload, BookOpen } from "lucide-react";
import Image from "next/image";
import { uploadToS3Action } from "../../../actions/uploadToS3";
import { createCourseAction } from "../../../actions/createCourse";

export default function CreateCourseClient({ recipes }: { recipes: any[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Recipes bundled with the course
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  
  // Lessons array
  const [lessons, setLessons] = useState<{ title: string; description: string; videoUrl: string }[]>([
    { title: "", description: "", videoUrl: "" }
  ]);

  const [loading, setLoading] = useState(false);

  const handleAddLesson = () => {
    setLessons([...lessons, { title: "", description: "", videoUrl: "" }]);
  };

  const handleRemoveLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const handleLessonChange = (index: number, field: string, value: string) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === lessons.length - 1) return;

    const updated = [...lessons];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    setLessons(updated);
  };

  const handleRecipeToggle = (recipeId: string) => {
    if (selectedRecipeIds.includes(recipeId)) {
      setSelectedRecipeIds(selectedRecipeIds.filter(id => id !== recipeId));
    } else {
      setSelectedRecipeIds([...selectedRecipeIds, recipeId]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadToS3Action(formData);
    if (result.success && result.url) {
      return result.url;
    } else {
      throw new Error(result.error || "Upload failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim()) {
      alert("Пожалуйста, заполните основные поля курса");
      return;
    }

    const filteredLessons = lessons.filter(l => l.title.trim() !== "");
    if (filteredLessons.length === 0) {
      alert("Пожалуйста, добавьте хотя бы один урок с названием");
      return;
    }

    try {
      setLoading(true);
      
      let imageUrl = "";
      if (coverImage) {
        console.log("Uploading course cover image...");
        imageUrl = await uploadFile(coverImage);
      }

      console.log("Saving course...");
      const result = await createCourseAction({
        title,
        description,
        price: Number(price),
        image_url: imageUrl,
        recipeIds: selectedRecipeIds,
        lessons: filteredLessons
      });

      if (result.success) {
        alert("Обучающий курс успешно создан!");
        router.push("/cabinet");
        router.refresh();
      } else {
        alert("Ошибка при сохранении: " + result.error);
      }
    } catch (err: any) {
      alert("Ошибка при сохранении: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] pb-32 font-sans">
      <header className="px-4 py-4 md:px-16 md:py-8 w-full flex justify-between items-center bg-[#fcfcf9]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#f1f0e9]">
        <Link href="/cabinet" className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-semibold">
          <ArrowLeft size={16} className="mr-2" />
          <span>Кабинет</span>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8a8883]">Создание курса</span>
      </header>

      <div className="max-w-[900px] mx-auto px-6 mt-12">
        <h1 className="font-serif italic text-4xl md:text-6xl mb-8">Новый обучающий курс</h1>

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Main Info */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#f1f0e9] space-y-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a8883] border-b border-[#f1f0e9] pb-4">Основное описание</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Название курса</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="например, Кондитерское дело для начинающих"
                className="w-full bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none rounded-xl px-4 py-3.5 text-sm transition-colors font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Стоимость (руб.)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="например, 499"
                  className="w-full bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none rounded-xl px-4 py-3.5 text-sm transition-colors font-medium"
                  required
                />
              </div>

              {/* Cover Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Обложка / Аватарка курса</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[#f5f4f0] border border-[#e2e0d8] hover:bg-[#eae8e1] rounded-xl cursor-pointer text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0">
                    <Upload size={14} />
                    Выбрать файл
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden" 
                    />
                  </label>
                  {coverPreview && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#e2e0d8] shrink-0">
                      <Image src={coverPreview} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Краткое описание курса</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Подробно расскажите, о чем этот курс и чему научится студент..."
                rows={5}
                className="w-full bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none rounded-xl px-4 py-3.5 text-sm transition-colors resize-none font-medium leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Recipes Bundling */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#f1f0e9] space-y-8 shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a8883] border-b border-[#f1f0e9] pb-4">Связанные рецепты</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#8a8883] mt-2 font-medium leading-relaxed">
                Выберите рецепты, которые будут бесплатно выданы (разблокированы) пользователю навсегда при покупке этого курса.
              </p>
            </div>

            {recipes.length === 0 ? (
              <p className="text-xs italic text-[#8a8883]">В архиве пока нет рецептов.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-2">
                {recipes.map((recipe) => {
                  const isChecked = selectedRecipeIds.includes(recipe.id);
                  return (
                    <label 
                      key={recipe.id}
                      className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-colors ${
                        isChecked 
                          ? "border-[#2d2c2a] bg-[#fcfcf9]" 
                          : "border-[#f1f0e9] hover:bg-[#fcfcf9]"
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRecipeToggle(recipe.id)}
                        className="mt-0.5 rounded text-[#2d2c2a] focus:ring-[#2d2c2a]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#2d2c2a]">{recipe.title}</span>
                        <span className="text-[9px] uppercase tracking-widest text-[#8a8883] mt-0.5">{recipe.category}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lessons list */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a8883] flex items-center gap-2">
                <BookOpen size={16} /> Программа курса (Уроки)
              </h3>
              <button 
                type="button" 
                onClick={handleAddLesson}
                className="bg-[#2d2c2a] text-white hover:bg-black transition-colors px-5 py-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={12} /> Добавить урок
              </button>
            </div>

            {lessons.map((lesson, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-[#f1f0e9] relative space-y-6 shadow-sm">
                
                {/* Lesson Header Actions */}
                <div className="flex justify-between items-center border-b border-[#f1f0e9] pb-4">
                  <span className="text-sm font-serif italic font-bold text-[#8a8883]">Урок #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => moveLesson(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-[#f5f4f0] rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => moveLesson(idx, 'down')}
                      disabled={idx === lessons.length - 1}
                      className="p-1.5 hover:bg-[#f5f4f0] rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <div className="w-[1px] h-3 bg-[#e2e0d8] mx-1" />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveLesson(idx)}
                      disabled={lessons.length === 1}
                      className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Название урока</label>
                  <input 
                    type="text" 
                    value={lesson.title}
                    onChange={e => handleLessonChange(idx, "title", e.target.value)}
                    placeholder="например, Теория замеса слоеного теста"
                    className="w-full bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none rounded-xl px-4 py-3 text-xs transition-colors font-medium"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Ссылка на видео урока (VK Video, YouTube, RuTube)</label>
                  <input 
                    type="text" 
                    value={lesson.videoUrl}
                    onChange={e => handleLessonChange(idx, "videoUrl", e.target.value)}
                    placeholder="вставьте ссылку на видео или код для встраивания"
                    className="w-full bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none rounded-xl px-4 py-3 text-xs transition-colors font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">Содержание урока</label>
                  <textarea 
                    value={lesson.description}
                    onChange={e => handleLessonChange(idx, "description", e.target.value)}
                    placeholder="Опишите, о чем этот урок, какие теоретические или практические моменты рассматриваются..."
                    rows={4}
                    className="w-full bg-[#fcfcf9] border border-[#e2e0d8] focus:border-[#2d2c2a] outline-none rounded-xl px-4 py-3 text-xs transition-colors resize-none font-medium leading-relaxed"
                  />
                </div>

              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#2d2c2a] text-white hover:bg-black transition-colors px-12 py-5 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Создание..." : "Создать и опубликовать курс"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
