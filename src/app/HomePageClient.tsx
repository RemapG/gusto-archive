"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ChefHat, User, LogOut, Plus, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getUserRole } from "./actions/getRole";

export default function HomePageClient({ initialRecipes }: { initialRecipes: any[] }) {
  const [recipes, setRecipes] = useState<any[]>(initialRecipes);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("user");
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const userRole = await getUserRole(userId);
      setRole(userRole);
    };

    // Check auth on load
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        fetchRole(data.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchRole(currentUser.id);
      } else {
        setRole("user");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSeedData = async () => {
    alert("Пожалуйста, выполните SQL скрипт из предыдущего сообщения в вашем Supabase SQL Editor. По соображениям безопасности клиент не может сам создавать рецепты без прав администратора.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-muted-foreground/30 font-sans flex flex-col">
      {/* Header */}
      <header className="px-8 py-8 md:px-16 w-full mx-auto flex justify-between items-center bg-background z-50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          <ChefHat size={28} className="text-foreground" />
          <span className="font-serif italic text-2xl tracking-wide">Архив Gusto</span>
        </Link>
        
        <div className="flex items-center text-xs uppercase tracking-widest font-medium text-muted-foreground gap-6">
          <Link href="/cabinet" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <User size={14} />
            Кабинет
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="hidden sm:block text-[10px] lowercase opacity-50">{user.email?.split('@')[0]}</span>
                {role === 'admin' && (
                  <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100 mt-0.5">ADMIN</span>
                )}
              </div>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 bg-[#42403a] text-white px-4 py-2 rounded-full hover:bg-black transition-colors"
              >
                <LogOut size={14} />
                Выйти
              </button>
            </div>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 hover:text-foreground transition-colors">
              Войти
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 px-8 md:px-16 py-12 w-full max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="font-serif italic text-6xl md:text-8xl leading-[1.1] mb-8 text-foreground tracking-tight">
              Рекомендуемые <br/>рецепты
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] leading-loose text-muted-foreground font-medium max-w-sm">
              КУРАТОРСКИЕ КУЛИНАРНЫЕ ВПЕЧАТЛЕНИЯ ОТ ЛУЧШИХ ШЕФ-ПОВАРОВ, МГНОВЕННО РАЗБЛОКИРОВАННЫЕ ДЛЯ ВАШЕЙ КУХНИ.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mr-2">
              КОЛЛЕКЦИЯ
            </div>
            {role === 'admin' && (
              <Link 
                href="/cabinet/create"
                className="w-12 h-12 rounded-full bg-[#35332f] text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <Plus size={20} />
              </Link>
            )}
            <button className="w-12 h-12 rounded-full bg-[#1c1b19] text-white flex items-center justify-center hover:bg-black transition-colors">
              <Filter size={18} fill="currentColor" />
            </button>
            <button className="w-12 h-12 rounded-full border border-border bg-transparent text-foreground flex items-center justify-center hover:bg-muted transition-colors">
              <ShoppingBag size={18} />
            </button>
          </motion.div>
        </div>

        {/* Content Area */}
        {loading ? (
           <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground uppercase tracking-widest text-xs animate-pulse">
             Загрузка архива...
           </div>
        ) : recipes.length === 0 ? (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full py-32 rounded-[2.5rem] border border-dashed border-border bg-background flex flex-col items-center justify-center text-center"
          >
            <ChefHat size={48} className="text-border mb-6" strokeWidth={1.5} />
            <h2 className="font-serif italic text-3xl mb-4 text-foreground">Библиотека пустует</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-12 font-medium">
              Каталог обновляется.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button className="bg-[#2d2c2a] text-white px-8 py-3 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
                <Plus size={16} /> Начать архивацию
              </button>
              <button 
                onClick={handleSeedData}
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border mt-2"
              >
                Засеять демо-архив
              </button>
            </div>
          </motion.div>
        ) : (
          /* Recipes Grid */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {recipes.map((recipe, index) => (
              <motion.div 
                key={recipe.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="group relative"
              >
                <Link href={`/recipe/${recipe.id}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted mb-6">
                    <Image
                      src={recipe.image_url || "/scallop.png"}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </div>
                  
                  <div className="flex justify-between items-start px-2">
                    <div>
                      <h2 className="font-serif italic text-2xl mb-2 text-foreground group-hover:opacity-70 transition-opacity">{recipe.title}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 font-medium">{recipe.category}</p>
                    </div>
                    <div className="text-sm font-medium text-foreground whitespace-nowrap mt-1">{recipe.price} ₽</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
      
      {/* Footer */}
      <footer className="mt-24 border-t border-border bg-[#f1f0e9] px-8 md:px-16 py-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity mb-8">
              <ChefHat size={20} className="text-foreground" />
              <span className="font-serif italic text-lg">Gusto</span>
            </Link>
            <p className="text-[10px] uppercase tracking-widest leading-loose text-muted-foreground max-w-xs font-medium">
              ИСКЛЮЧИТЕЛЬНЫЕ КУЛИНАРНЫЕ<br/>ТЕХНИЧЕСКИЕ ФАЙЛЫ ДЛЯ СОВРЕМЕННОГО<br/>ПРИГОТОВЛЕНИЯ ЕДЫ.
            </p>
          </div>
          
          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="text-[10px] text-border mb-2 text-foreground">НАВИГАЦИЯ</span>
            <Link href="/" className="hover:text-foreground transition-colors">Каталог</Link>
            <Link href="/cabinet" className="hover:text-foreground transition-colors">Кабинет</Link>
          </div>

          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="text-[10px] text-border mb-2 text-foreground">ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ</span>
            <Link href="#" className="hover:text-foreground transition-colors">Условия использования</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Конфиденциальность</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
