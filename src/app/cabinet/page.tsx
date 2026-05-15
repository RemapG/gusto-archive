"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChefHat, Plus, LogOut } from "lucide-react";
import { motion } from "framer-motion";

import { getUserRole } from "../actions/getRole";

export default function CabinetPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("user");
  const [purchasedRecipes, setPurchasedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/auth");
        return;
      }
      setUser(authData.user);

      // Fetch user role via Server Action (bypassing proxy 406 error)
      const userRole = await getUserRole(authData.user.id);
      setRole(userRole);

      // Fetch purchased recipes
      const { data: purchases } = await supabase
        .from("purchases")
        .select(`
          recipe_id,
          recipes ( id, title, category, image_url )
        `)
        .eq("user_id", authData.user.id);
      
      if (purchases) {
        // Unpack nested response
        const mappedRecipes = purchases.map((p: any) => p.recipes);
        setPurchasedRecipes(mappedRecipes.filter(r => r !== null));
      }

      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f6f5f0] flex items-center justify-center font-medium text-xs uppercase tracking-widest text-[#8a8883] animate-pulse">Загрузка кабинета...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f6f5f0] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans">
      <header className="px-8 py-6 md:px-16 md:py-8 w-full max-w-[1400px] mx-auto flex justify-between items-center">
        <Link href="/" className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-medium">
          <ArrowLeft size={16} className="mr-2" />
          На главную
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
        >
          <LogOut size={14} />
          Выйти
        </button>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h1 className="font-serif italic text-5xl md:text-6xl mb-4">Личный кабинет</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a8883] font-medium">
              {user?.email} • {role === 'admin' ? 'АДМИНИСТРАТОР' : 'КУЛИНАР'}
            </p>
          </div>
          
          {role === 'admin' && (
            <Link 
              href="/cabinet/create"
              className="bg-[#2d2c2a] text-white px-8 py-4 rounded-full text-[10px] font-medium uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              <Plus size={16} /> Создать новый рецепт
            </Link>
          )}
        </div>

        <h2 className="text-sm font-medium uppercase tracking-widest border-b border-[#e2e0d8] pb-4 mb-8 text-[#8a8883]">
          Моя коллекция
        </h2>

        {purchasedRecipes.length === 0 ? (
          <div className="w-full py-24 rounded-[2.5rem] border border-dashed border-[#e2e0d8] flex flex-col items-center justify-center text-center">
            <ChefHat size={40} className="text-[#e2e0d8] mb-6" strokeWidth={1.5} />
            <h3 className="font-serif italic text-2xl mb-4">Коллекция пустует</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8883] font-medium max-w-xs">
              ВЫ ПОКА НЕ РАЗБЛОКИРОВАЛИ НИ ОДНОГО РЕЦЕПТА ИЗ АРХИВА.
            </p>
            <Link href="/" className="mt-8 text-xs underline underline-offset-4 font-medium uppercase tracking-widest hover:text-[#8a8883] transition-colors">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {purchasedRecipes.map((recipe, i) => (
              <motion.div 
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <Link href={`/recipe/${recipe.id}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#e8e6df] mb-4">
                    <Image
                      src={recipe.image_url || "/scallop.png"}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif italic text-xl mb-1 text-[#2d2c2a] group-hover:opacity-70 transition-opacity">{recipe.title}</h3>
                    <p className="text-[10px] text-[#8a8883] uppercase tracking-widest font-medium">{recipe.category}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
