"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Image as ImageIcon, Timer, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createRecipeAction } from "../../actions/createRecipe";
import { uploadToS3Action } from "../../actions/uploadToS3";
import { useSession } from "next-auth/react";
import { processImageFile } from "@/lib/imageConverter";

const DISH_CATEGORIES = [
  "Закуски холодные",
  "Закуски горячие",
  "Салаты",
  "Супы",
  "Основные блюда",
  "Десерты",
  "Соусы",
  "Заготовки",
  "Курсы",
  "Гарниры"
];

const DRAFT_KEY = "chef_recipe_draft_v1";

export default function CreateRecipePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Основные блюда"]);
  const [price, setPrice] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [processingMainImage, setProcessingMainImage] = useState(false);
  const [availableInSubscription, setAvailableInSubscription] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);

  const [steps, setRecipeSteps] = useState<any[]>([
    { text: "", image: null, imagePreview: null, timerMinutes: "", videoUrl: "" }
  ]);
  const [processingStepIndex, setProcessingStepIndex] = useState<number | null>(null);

  // Draft banner state
  const [hasDraft, setHasDraft] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated") {
      const role = (session?.user as any)?.role || "user";
      if (role !== "admin") {
        router.push("/cabinet");
        return;
      }
      setLoading(false);
    }
  }, [status, router, session]);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        const hasContent = Boolean(
          draft.title || 
          (draft.description && draft.description.trim()) || 
          (draft.ingredients && draft.ingredients.some((i: string) => i && i.trim())) || 
          (draft.steps && draft.steps.some((s: any) => s && s.text && s.text.trim()))
        );
        if (hasContent) {
          setHasDraft(true);
          if (draft.updatedAt) {
            setDraftDate(new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (e) {
      console.error("Error reading draft:", e);
    }
  }, []);

  // Restore draft handler
  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.title !== undefined) setTitle(draft.title);
      if (draft.selectedCategories) setSelectedCategories(draft.selectedCategories);
      if (draft.price !== undefined) setPrice(draft.price);
      if (draft.isFree !== undefined) setIsFree(draft.isFree);
      if (draft.availableInSubscription !== undefined) setAvailableInSubscription(draft.availableInSubscription);
      if (draft.videoUrl !== undefined) setVideoUrl(draft.videoUrl);
      if (draft.description !== undefined) setDescription(draft.description);
      if (draft.ingredients && draft.ingredients.length > 0) setIngredients(draft.ingredients);
      if (draft.steps && draft.steps.length > 0) {
        setRecipeSteps(draft.steps.map((s: any) => ({
          text: s.text || "",
          image: null,
          imagePreview: null,
          timerMinutes: s.timerMinutes || "",
          videoUrl: s.videoUrl || ""
        })));
      }
      if (draft.step) setStep(draft.step);
      setHasDraft(false);
    } catch (e) {
      console.error("Error restoring draft:", e);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    } catch (e) {}
  };

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasContent = Boolean(
        title.trim() || 
        description.trim() || 
        ingredients.some(i => i && i.trim()) || 
        steps.some(s => s && s.text && s.text.trim())
      );
      if (hasContent) {
        try {
          const draftData = {
            title,
            selectedCategories,
            price,
            isFree,
            availableInSubscription,
            videoUrl,
            description,
            ingredients,
            steps: steps.map(s => ({
              text: s.text,
              timerMinutes: s.timerMinutes,
              videoUrl: s.videoUrl
            })),
            step,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        } catch (e) {}
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [title, selectedCategories, price, isFree, availableInSubscription, videoUrl, description, ingredients, steps, step]);

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setProcessingMainImage(true);
      try {
        const { file, previewUrl } = await processImageFile(originalFile);
        setMainImage(file);
        setMainImagePreview(previewUrl);
      } catch (err) {
        console.error("Error processing main image:", err);
        setMainImage(originalFile);
        setMainImagePreview(URL.createObjectURL(originalFile));
      } finally {
        setProcessingMainImage(false);
      }
    }
  };

  const handleStepImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      setProcessingStepIndex(index);
      try {
        const { file, previewUrl } = await processImageFile(originalFile);
        const newSteps = [...steps];
        newSteps[index].image = file;
        newSteps[index].imagePreview = previewUrl;
        setRecipeSteps(newSteps);
      } catch (err) {
        console.error("Error processing step image:", err);
        const newSteps = [...steps];
        newSteps[index].image = originalFile;
        newSteps[index].imagePreview = URL.createObjectURL(originalFile);
        setRecipeSteps(newSteps);
      } finally {
        setProcessingStepIndex(null);
      }
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadToS3Action(formData);
    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }
    return result.url!;
  };

  const handleSave = async () => {
    try {
      console.log("Saving recipe started...");
      setSaving(true);
      setError(null);

      // 1. Upload Main Image
      let mainImageUrl = "/placeholder.jpg";
      if (mainImage) {
        console.log("Uploading main image...");
        mainImageUrl = await uploadFile(mainImage);
      }

      // 2. Upload Step Images
      console.log("Uploading step images...");
      const finalSteps = await Promise.all(steps.map(async (s) => {
        let stepImgUrl = null;
        if (s.image) {
          stepImgUrl = await uploadFile(s.image);
        }
        return { 
          text: s.text, 
          image_url: stepImgUrl,
          timer: s.timerMinutes ? parseInt(s.timerMinutes) * 60 : null,
          video_url: s.videoUrl || null
        };
      }));

      // 3. Use Server Action for Database Operations
      console.log("Creating recipe in database...");
      const result = await createRecipeAction({
        title,
        category: selectedCategories.join(', ') || "Основные блюда",
        description,
        price: isFree ? 0 : (parseFloat(price) || 0),
        image_url: mainImageUrl,
        video_url: videoUrl || "",
        available_in_subscription: isFree ? true : availableInSubscription,
        is_free: isFree,
        ingredients,
        steps: finalSteps
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Clear draft on successful creation
      clearDraft();

      console.log("Recipe created successfully, redirecting...");
      setSuccess(true);
      
      // Delay slightly for visual feedback then redirect
      setTimeout(() => {
        router.push(`/recipe/${result.recipeId}`);
        router.refresh();
      }, 1000);
      
    } catch (err: any) {
      console.error("Save error:", err);
      // Persist draft immediately in case of error
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title,
          selectedCategories,
          price,
          isFree,
          availableInSubscription,
          videoUrl,
          description,
          ingredients,
          steps: steps.map(s => ({
            text: s.text,
            timerMinutes: s.timerMinutes,
            videoUrl: s.videoUrl
          })),
          step,
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {}

      let errMsg = err.message || "Ошибка при сохранении рецепта";
      if (errMsg.includes("unexpected response") || errMsg.includes("Failed to fetch") || errMsg.includes("413")) {
        errMsg = "Сервер отклонил файл из-за большого размера или сбоя связи. Ваш текст сохранён в черновике! Попробуйте сохранить рецепт ещё раз.";
      }
      setError(errMsg);
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f6f5f0] flex items-center justify-center font-medium text-xs uppercase tracking-widest text-[#8a8883] animate-pulse">Проверка прав...</div>;

  if (success) return (
    <div className="min-h-screen bg-[#f6f5f0] flex flex-col items-center justify-center font-serif italic text-2xl gap-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Check size={64} className="text-green-600 mb-4 mx-auto" />
        <p>Рецепт успешно опубликован!</p>
        <p className="text-xs font-sans uppercase tracking-[0.2em] text-[#8a8883] mt-2 non-italic">Перенаправляем в архив...</p>
      </motion.div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f6f5f0] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans pb-32">
      <header className="px-8 py-6 md:px-16 md:py-8 w-full max-w-[1000px] mx-auto">
        <Link href="/cabinet" className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Назад в кабинет
        </Link>
      </header>

      <div className="max-w-[800px] mx-auto px-8">
        <h1 className="font-serif italic text-4xl mb-2">Создание рецепта</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8883] font-medium mb-12">
          ШАГ {step} ИЗ 3
        </p>

        {hasDraft && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">📝</span>
              <span>
                Есть сохранённый черновик рецепта{draftDate ? ` (от ${draftDate})` : ""}. Восстановить в форму?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={restoreDraft}
                className="bg-amber-900 text-white px-4 py-1.5 rounded-full font-medium hover:bg-black transition-colors"
              >
                Восстановить
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="text-amber-800 hover:text-amber-950 px-2 py-1.5 underline transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        )}

        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm font-light rounded-2xl border border-red-100">{error}</div>}

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-[#e2e0d8]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-medium mb-8">Базовая информация</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Фото блюда</label>
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-40 bg-[#f6f5f0] rounded-2xl overflow-hidden relative border border-dashed border-[#e2e0d8] flex items-center justify-center">
                        {processingMainImage ? (
                          <div className="flex flex-col items-center gap-2 p-2 text-center">
                            <Loader2 size={24} className="animate-spin text-[#2d2c2a]" />
                            <span className="text-[9px] uppercase tracking-wider text-[#8a8883] font-medium">Обработка...</span>
                          </div>
                        ) : mainImagePreview ? (
                          <img src={mainImagePreview} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-[#e2e0d8]" />
                        )}
                      </div>
                      <label className="bg-[#2d2c2a] text-white px-6 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-colors cursor-pointer flex items-center gap-2">
                        {processingMainImage && <Loader2 size={12} className="animate-spin" />}
                        {processingMainImage ? "Конвертация..." : "Загрузить фото"}
                        <input type="file" accept="image/*" className="hidden" disabled={processingMainImage} onChange={handleMainImageChange} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Название</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-b border-[#e2e0d8] py-3 bg-transparent focus:outline-none focus:border-black font-serif italic text-2xl" placeholder="Например: Идеальный Гребешок" />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-3 font-medium">Вид блюда (можно выбрать несколько)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#f8f7f2] p-6 rounded-2xl border border-[#e2e0d8]">
                        {DISH_CATEGORIES.map((cat) => {
                          const isChecked = selectedCategories.includes(cat);
                          return (
                            <label key={cat} className="flex items-center gap-2.5 text-xs font-light text-[#2d2c2a] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                  } else {
                                    setSelectedCategories([...selectedCategories, cat]);
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                              />
                              {cat}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Цена (₽)</label>
                      <input 
                        type="number" 
                        value={isFree ? "0" : price} 
                        disabled={isFree}
                        onChange={e => setPrice(e.target.value)} 
                        className={`w-full border-b border-[#e2e0d8] py-3 bg-transparent focus:outline-none focus:border-black font-light ${isFree ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        placeholder={isFree ? "Бесплатно (0 ₽)" : "1000"} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-5 border-t border-[#f1f0e9] mt-6">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="isFreeToggle"
                        checked={isFree} 
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsFree(checked);
                          if (checked) {
                            setPrice("0");
                          }
                        }} 
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <label htmlFor="isFreeToggle" className="text-xs font-light text-[#2d2c2a] cursor-pointer select-none">
                        <strong className="font-semibold text-emerald-800">Доступен для всех бесплатно</strong> (даже для незарегистрированных пользователей)
                      </label>
                    </div>

                    {!isFree && (
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="subscriptionToggle"
                          checked={availableInSubscription} 
                          onChange={e => setAvailableInSubscription(e.target.checked)} 
                          className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                        <label htmlFor="subscriptionToggle" className="text-xs font-light text-[#2d2c2a] cursor-pointer select-none">
                          Доступен по подписке (пользователи с активной подпиской получат доступ)
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col pt-4">
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">
                      Ссылка на видео или код вставки VK/YouTube (опционально)
                    </label>
                    <input 
                      type="text" 
                      value={videoUrl} 
                      onChange={e => setVideoUrl(e.target.value)} 
                      className="w-full border-b border-[#e2e0d8] py-3 bg-transparent focus:outline-none focus:border-black font-light text-sm" 
                      placeholder="Вставьте ссылку на видео или код iframe..." 
                    />
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!title || (!isFree && !price)} 
                    className="bg-[#2d2c2a] text-white px-8 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    Далее <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-medium mb-8">Описание и Ингредиенты</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Краткое описание (для витрины)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-[#e2e0d8] rounded-2xl p-4 bg-transparent focus:outline-none focus:border-black font-light resize-none" placeholder="Расскажите о блюде..." />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-4 font-medium">Список ингредиентов</label>
                    <div className="space-y-3">
                      {ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-3">
                          <input type="text" value={ing} onChange={e => { const newIng = [...ingredients]; newIng[i] = e.target.value; setIngredients(newIng); }} className="flex-1 border-b border-[#e2e0d8] py-2 bg-transparent focus:outline-none focus:border-black font-light" placeholder="Например: Морская соль - 10 г" />
                          <button onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-[#8a8883] hover:text-red-500 transition-colors mt-2"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setIngredients([...ingredients, ""])} className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 mt-4 hover:opacity-70">
                        <Plus size={14} /> Добавить ингредиент
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest border border-[#e2e0d8] hover:bg-[#f6f5f0] transition-colors flex items-center gap-2">
                    <ArrowLeft size={14} /> Назад
                  </button>
                  <button onClick={() => setStep(3)} disabled={!description || ingredients.length === 0} className="bg-[#2d2c2a] text-white px-8 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
                    Далее <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-medium mb-8">Шаги приготовления</h2>
                
                <div className="space-y-12">
                  {steps.map((s, i) => (
                    <div key={i} className="relative pl-8 border-l border-[#e2e0d8]">
                      <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#f6f5f0] border border-[#e2e0d8] flex items-center justify-center text-[10px] font-medium">{i + 1}</span>
                      
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-3">
                          <textarea value={s.text} onChange={e => { const newSteps = [...steps]; newSteps[i].text = e.target.value; setRecipeSteps(newSteps); }} rows={4} className="w-full border border-[#e2e0d8] rounded-2xl p-4 bg-transparent focus:outline-none focus:border-black font-light resize-none" placeholder={`Описание шага ${i + 1}...`} />
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Timer size={14} className="text-[#8a8883]" />
                              <input 
                                type="number" 
                                placeholder="Таймер (мин)" 
                                value={s.timerMinutes || ""} 
                                onChange={e => {
                                   const newSteps = [...steps]; 
                                   newSteps[i].timerMinutes = e.target.value; 
                                   setRecipeSteps(newSteps); 
                                }}
                                className="border border-[#e2e0d8] rounded-lg px-3 py-1.5 text-xs font-light focus:outline-none focus:border-black w-32 bg-white"
                              />
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-[10px] text-[#8a8883] uppercase tracking-widest font-medium whitespace-nowrap">Видео:</span>
                              <input 
                                type="text" 
                                placeholder="Ссылка на видео шага или iframe код" 
                                value={s.videoUrl || ""} 
                                onChange={e => {
                                   const newSteps = [...steps]; 
                                   newSteps[i].videoUrl = e.target.value; 
                                   setRecipeSteps(newSteps); 
                                }}
                                className="flex-1 border border-[#e2e0d8] rounded-lg px-3 py-1.5 text-xs font-light focus:outline-none focus:border-black bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-40 flex-shrink-0">
                          <label className="block w-full h-24 border border-dashed border-[#e2e0d8] rounded-2xl overflow-hidden relative cursor-pointer hover:bg-[#f6f5f0] transition-colors flex items-center justify-center group">
                            {processingStepIndex === i ? (
                              <div className="flex flex-col items-center gap-1 p-2 text-center">
                                <Loader2 size={18} className="animate-spin text-[#2d2c2a]" />
                                <span className="text-[9px] uppercase tracking-wider text-[#8a8883]">Обработка...</span>
                              </div>
                            ) : s.imagePreview ? (
                              <img src={s.imagePreview} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center text-[#8a8883] group-hover:text-black">
                                <ImageIcon size={20} className="mx-auto mb-1" />
                                <span className="text-[10px] uppercase tracking-widest font-medium">Фото (опц.)</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              disabled={processingStepIndex === i} 
                              onChange={(e) => handleStepImageChange(i, e)} 
                            />
                          </label>
                        </div>
                      </div>
                      {steps.length > 1 && (
                        <button onClick={() => setRecipeSteps(steps.filter((_, idx) => idx !== i))} className="absolute -left-[4.5rem] top-8 text-[#8a8883] hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}

                  <button onClick={() => setRecipeSteps([...steps, { text: "", image: null, imagePreview: null, timerMinutes: "", videoUrl: "" }])} className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 hover:opacity-70 bg-[#f6f5f0] px-6 py-3 rounded-full">
                    <Plus size={14} /> Добавить шаг
                  </button>
                </div>

                <div className="mt-16 pt-8 border-t border-[#e2e0d8] flex justify-between items-center">
                  <button onClick={() => setStep(2)} disabled={saving} className="px-6 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest border border-[#e2e0d8] hover:bg-[#f6f5f0] transition-colors flex items-center gap-2 disabled:opacity-50">
                    <ArrowLeft size={14} /> Назад
                  </button>
                  <button onClick={handleSave} disabled={saving || !steps[0].text} className="bg-green-700 text-white px-8 py-4 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {saving ? "Публикация..." : <><Check size={16} /> Опубликовать рецепт</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
