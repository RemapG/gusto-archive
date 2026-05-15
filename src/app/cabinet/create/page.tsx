"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserRole } from "../../actions/getRole";
import { createRecipeAction } from "../../actions/createRecipe";

export default function CreateRecipePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const [steps, setRecipeSteps] = useState<{ text: string; image: File | null; imagePreview: string | null }[]>([
    { text: "", image: null, imagePreview: null }
  ]);

  useEffect(() => {
    async function checkAdmin() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/auth");
        return;
      }
      
      const role = await getUserRole(authData.user.id);
      
      if (role !== "admin") {
        router.push("/cabinet");
        return;
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

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

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = fileName; // Upload directly to bucket root

    const { error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('recipes').getPublicUrl(filePath);
    return data.publicUrl;
  };




  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // 1. Upload Main Image
      let mainImageUrl = "/placeholder.jpg";
      if (mainImage) {
        mainImageUrl = await uploadImage(mainImage);
      }

      // 2. Upload Step Images
      const finalSteps = await Promise.all(steps.map(async (s) => {
        let stepImgUrl = null;
        if (s.image) {
          stepImgUrl = await uploadImage(s.image);
        }
        return { text: s.text, image_url: stepImgUrl };
      }));

      // 3. Use Server Action for Database Operations
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Не удалось получить токен авторизации");
      }

      const result = await createRecipeAction({
        title,
        category,
        description,
        price: parseFloat(price) || 0,
        image_url: mainImageUrl,
        ingredients,
        steps: finalSteps
      }, accessToken);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push(`/recipe/${result.recipeId}`);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ошибка при сохранении рецепта");
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f6f5f0] flex items-center justify-center font-medium text-xs uppercase tracking-widest text-[#8a8883] animate-pulse">Проверка прав...</div>;

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
                        <textarea value={s.text} onChange={e => { const newSteps = [...steps]; newSteps[i].text = e.target.value; setRecipeSteps(newSteps); }} rows={4} className="flex-1 border border-[#e2e0d8] rounded-2xl p-4 bg-transparent focus:outline-none focus:border-black font-light resize-none" placeholder={`Описание шага ${i + 1}...`} />
                        
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

                  <button onClick={() => setRecipeSteps([...steps, { text: "", image: null, imagePreview: null }])} className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 hover:opacity-70 bg-[#f6f5f0] px-6 py-3 rounded-full">
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
