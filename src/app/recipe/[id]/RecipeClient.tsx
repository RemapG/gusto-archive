"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2, Trash2, ChefHat } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "../../actions/getRole";
import { deleteRecipeAction } from "../../actions/deleteRecipe";
import { useRouter } from "next/navigation";

export default function RecipeClient({ initialRecipe, recipeId }: { initialRecipe: any, recipeId: string }) {
  const router = useRouter();
  const recipe = initialRecipe;
  const [content, setContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [purchased, setPurchased] = useState<boolean | null>(null); // null = checking, true = yes, false = no
  const [role, setRole] = useState<string>("user");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      setLoadingContent(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const userRole = await getUserRole(authData.user.id);
          setRole(userRole);
        }

        const { data: contentResponse } = await supabase
          .from("recipe_contents")
          .select("*")
          .eq("recipe_id", recipeId)
          .maybeSingle();

        if (contentResponse) {
          setContent(contentResponse);
          setPurchased(true); 
        } else {
          setPurchased(false);
        }
      } catch (err) {
        console.error("Error loading recipe contents:", err);
        setPurchased(false);
      } finally {
        setLoadingContent(false);
      }
    }
    checkAccess();
  }, [recipeId]);

  const handlePurchase = async () => {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData.user) {
      alert("Для доступа необходимо войти в аккаунт.");
      return;
    }

    // Insert purchase for real
    const { error } = await supabase.from("purchases").insert({
      user_id: authData.user.id,
      recipe_id: recipeId
    });

    if (error && error.code !== '23505') {
      alert("Ошибка при добавлении в коллекцию: " + error.message);
      return;
    }

    // Refetch content now that we have access
    const { data: contentData } = await supabase
      .from("recipe_contents")
      .select("*")
      .eq("recipe_id", recipeId)
      .maybeSingle();
    
    if (contentData) {
      setContent(contentData);
      setPurchased(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите навсегда удалить этот рецепт из архива?")) return;

    try {
      setIsDeleting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) throw new Error("Не удалось авторизоваться");

      const result = await deleteRecipeAction(recipeId, token);
      if (result.success) {
        router.push("/");
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert("Ошибка при удалении: " + err.message);
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] pb-32 font-sans">
      {/* Top Navigation & Admin Actions */}
      <header className="px-4 py-4 md:px-16 md:py-8 w-full flex justify-between items-center bg-[#fcfcf9]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#f1f0e9]">
        <Link href="/" className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-semibold">
          <ArrowLeft size={16} className="mr-2" />
          <span className="hidden sm:inline">Архив Gusto</span>
          <span className="sm:hidden">Gusto</span>
        </Link>

        {role === 'admin' && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">{isDeleting ? "Удаление..." : "Удалить рецепт"}</span>
            <span className="sm:hidden">Удалить</span>
          </button>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-16 pt-10 md:pt-16 pb-16 md:pb-24 border-b border-[#f1f0e9]">
        <div className="max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[9px] md:text-[10px] text-[#8a8883] uppercase tracking-[0.3em] mb-4 md:mb-6 font-bold"
          >
            {recipe.category} • ТЕХНИЧЕСКАЯ КАРТА
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-8xl font-serif italic tracking-tight leading-[1.2] md:leading-[1.1] mb-8 md:mb-12 text-[#2d2c2a]"
          >
            {recipe.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12"
          >
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-[#8a8883] mb-1">Стоимость доступа</span>
              <span className="text-xl md:text-2xl font-medium">{recipe.price} ₽</span>
            </div>
            <div className="hidden md:block h-10 w-[1px] bg-[#e2e0d8]" />
            <p className="text-xs text-[#8a8883] font-medium leading-relaxed max-w-md uppercase tracking-wider">
              {recipe.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <div className="max-w-[1400px] mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-20">
        
        {/* Left Column: Ingredients (Sticky) */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 text-[#8a8883] flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#e2e0d8]" />
              Ингредиенты
            </h3>
            
            {loadingContent || purchased === null ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 bg-[#f1f0e9] rounded w-full" />
                ))}
              </div>
            ) : purchased === false ? (
              <div className="bg-[#f6f5f0] p-10 rounded-[2rem] border border-[#f1f0e9]">
                 <Lock className="text-[#8a8883] mb-6" size={24} />
                 <p className="text-xs font-medium uppercase tracking-widest leading-loose text-[#8a8883] mb-8">
                   СПИСОК ИНГРЕДИЕНТОВ И ТОЧНЫЕ ГРАММОВКИ ЗАБЛОКИРОВАНЫ.
                 </p>
                 <button 
                  onClick={handlePurchase}
                  className="w-full bg-[#2d2c2a] text-white hover:bg-black transition-all py-5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-black/5 active:scale-95"
                >
                  Разблокировать
                </button>
              </div>
            ) : (
              <motion.ul 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {content?.ingredients?.map((ing: string, i: number) => (
                  <li key={i} className="text-sm font-medium border-b border-[#f1f0e9] pb-4 flex justify-between items-center group hover:border-[#2d2c2a] transition-colors">
                    <span className="text-[#2d2c2a] group-hover:translate-x-1 transition-transform">{ing}</span>
                    <CheckCircle2 size={14} className="text-[#e2e0d8] group-hover:text-green-600 transition-colors" />
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        </aside>

        {/* Right Column: Cooking Steps */}
        <div className="lg:col-span-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 text-[#8a8883] flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#e2e0d8]" />
            Процесс приготовления
          </h3>

          {loadingContent || purchased === null ? (
            <div className="space-y-12 animate-pulse">
              <div className="h-64 bg-[#f1f0e9] rounded-[3rem] w-full" />
              <div className="space-y-4">
                <div className="h-4 bg-[#f1f0e9] rounded w-3/4" />
                <div className="h-4 bg-[#f1f0e9] rounded w-1/2" />
              </div>
            </div>
          ) : purchased === false ? (
            <div className="relative aspect-video rounded-[3rem] overflow-hidden group cursor-pointer" onClick={handlePurchase}>
              <Image 
                src={recipe.image_url || "/scallop.png"} 
                alt="Locked Content" 
                fill 
                className="object-cover blur-md scale-110 opacity-50 grayscale transition-all duration-700 group-hover:scale-100 group-hover:blur-sm" 
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-8">
                 <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6">
                    <Lock size={32} className="text-white" />
                 </div>
                 <h4 className="text-2xl font-serif italic text-white mb-2">Архив закрыт</h4>
                 <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium">Купите доступ для просмотра техкарты</p>
              </div>
            </div>
          ) : (
            <div className="space-y-24">
              {content?.steps?.map((step: any, i: number) => {
                const stepText = typeof step === 'string' ? step : step.text;
                const stepImage = typeof step === 'object' && step.image_url ? step.image_url : null;
                
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col gap-10"
                  >
                    <div className="flex items-start gap-10">
                      <span className="text-8xl font-serif italic text-[#f1f0e9] leading-none select-none">
                        {i + 1}
                      </span>
                      <div className="pt-4">
                         <p className="text-lg md:text-xl font-light leading-relaxed text-[#2d2c2a]">
                           {stepText}
                         </p>
                      </div>
                    </div>
                    
                    {stepImage && (
                      <div className="relative w-full aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-[#f6f5f0] shadow-2xl shadow-black/5">
                        <Image 
                          src={stepImage} 
                          alt={`Шаг ${i+1}`} 
                          fill 
                          className="object-cover hover:scale-105 transition-transform duration-1000" 
                        />
                      </div>
                    )}
                    
                    {i < content.steps.length - 1 && (
                      <div className="w-20 h-[1px] bg-[#f1f0e9] mx-auto mt-12" />
                    )}
                  </motion.div>
                );
              })}
              
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="pt-20 text-center"
              >
                <div className="inline-block p-8 border border-[#f1f0e9] rounded-[2rem] bg-white">
                  <ChefHat size={32} className="mx-auto mb-4 text-[#e2e0d8]" />
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8a8883]">Блюдо готово к подаче</p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
