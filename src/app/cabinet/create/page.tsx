"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Image as ImageIcon, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createRecipeAction } from "../../actions/createRecipe";
import { uploadToS3Action } from "../../actions/uploadToS3";
import { useSession } from "next-auth/react";

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
  const [category, setCategory] = useState("Haute Cuisine");
  const [price, setPrice] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);

  const [steps, setRecipeSteps] = useState<any[]>([
    { text: "", image: null, imagePreview: null, timerMinutes: "" }
  ]);

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

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleStepImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newSteps = [...steps];
      newSteps[index].image = file;
      newSteps[index].imagePreview = URL.createObjectURL(file);
      setRecipeSteps(newSteps);
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
          timer: s.timerMinutes ? parseInt(s.timerMinutes) * 60 : null 
        };
      }));

      // 3. Use Server Action for Database Operations
      console.log("Creating recipe in database...");
      const result = await createRecipeAction({
        title,
        category,
        description,
        price: parseFloat(price) || 0,
        image_url: mainImageUrl,
        ingredients,
        steps: finalSteps
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("Recipe created successfully, redirecting...");
      setSuccess(true);
      
      // Delay slightly for visual feedback then redirect
      setTimeout(() => {
        router.push(`/recipe/${result.recipeId}`);
        router.refresh();
      }, 1000);
      
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Ошибка при сохранении рецепта");
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

        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm font-light rounded-sm border border-red-100">{error}</div>}

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
                        {mainImagePreview ? (
                          <img src={mainImagePreview} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-[#e2e0d8]" />
                        )}
                      </div>
                      <label className="bg-[#2d2c2a] text-white px-6 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-colors cursor-pointer">
                        Загрузить фото
                        <input type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Название</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-b border-[#e2e0d8] py-3 bg-transparent focus:outline-none focus:border-black font-serif italic text-2xl" placeholder="Например: Идеальный Гребешок" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Категория</label>
                      <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full border-b border-[#e2e0d8] py-3 bg-transparent focus:outline-none focus:border-black font-light" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#8a8883] mb-2 font-medium">Цена (₽)</label>
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border-b border-[#e2e0d8] py-3 bg-transparent focus:outline-none focus:border-black font-light" placeholder="1000" />
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button onClick={() => setStep(2)} disabled={!title || !price} className="bg-[#2d2c2a] text-white px-8 py-3 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
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
                            <span className="text-[10px] text-[#8a8883] uppercase tracking-widest font-medium">Опционально</span>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-40 flex-shrink-0">
                          <label className="block w-full h-24 border border-dashed border-[#e2e0d8] rounded-2xl overflow-hidden relative cursor-pointer hover:bg-[#f6f5f0] transition-colors flex items-center justify-center group">
                            {s.imagePreview ? (
                              <img src={s.imagePreview} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center text-[#8a8883] group-hover:text-black">
                                <ImageIcon size={20} className="mx-auto mb-1" />
                                <span className="text-[10px] uppercase tracking-widest font-medium">Фото (опц.)</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleStepImageChange(i, e)} />
                          </label>
                        </div>
                      </div>
                      {steps.length > 1 && (
                        <button onClick={() => setRecipeSteps(steps.filter((_, idx) => idx !== i))} className="absolute -left-[4.5rem] top-8 text-[#8a8883] hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}

                  <button onClick={() => setRecipeSteps([...steps, { text: "", image: null, imagePreview: null, timerMinutes: "" }])} className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 hover:opacity-70 bg-[#f6f5f0] px-6 py-3 rounded-full">
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
