"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ChefHat, User, LogOut, Plus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getUnreadMessagesCountAction } from "./actions/chat";

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

export default function HomePageClient({ initialRecipes, initialCourses = [] }: { initialRecipes: any[], initialCourses?: any[] }) {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<any[]>(initialRecipes);
  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [activeTab, setActiveTab] = useState<"recipes" | "courses">("recipes");
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const filteredRecipes = recipes.filter((recipe) => {
    if (selectedCategory === "Все") return true;
    if (!recipe.category) return false;
    const recipeCats = recipe.category.split(', ').map((c: string) => c.trim());
    return recipeCats.includes(selectedCategory);
  });

  const user = session?.user;
  const role = (session?.user as any)?.role || "user";

  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      try {
        const res = await getUnreadMessagesCountAction();
        if (res.success && typeof res.count === 'number') {
          setUnreadCount(res.count);
        }
      } catch (err) {
        console.error("Error checking unread messages:", err);
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 2000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const handleSeedData = async () => {

  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-muted-foreground/30 font-sans flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 md:px-16 w-full mx-auto flex justify-between items-center bg-background z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ChefHat size={24} className="text-foreground" />
          <span className="font-serif italic text-xl md:text-2xl tracking-wide">В гостях у Лидии</span>
        </Link>
        
        <div className="flex items-center text-[10px] uppercase tracking-widest font-medium text-muted-foreground gap-4 md:gap-6">
          <Link href="/about" className="hover:text-foreground transition-colors">
            Обо мне
          </Link>
          
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              {/* User profile button that links to cabinet */}
              <Link 
                href="/cabinet" 
                className="flex items-center gap-2.5 bg-white border border-[#e2e0d8] hover:border-[#2d2c2a] hover:bg-[#fcfcf9] transition-all px-3 py-1 rounded-full shadow-sm relative group cursor-pointer normal-case tracking-normal"
              >
                {/* Avatar with unread indicator */}
                <div className="w-8 h-8 rounded-full bg-[#2d2c2a] text-white flex items-center justify-center shrink-0 relative">
                  <User size={14} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#ff4d4f] rounded-full border border-white animate-pulse" />
                  )}
                </div>

                {/* Name & Role */}
                <div className="flex flex-col pr-1 text-left">
                  <span className="text-[11px] font-bold text-[#2d2c2a] lowercase tracking-normal leading-tight">
                    {user.email?.split('@')[0]}
                  </span>
                  {role === 'admin' ? (
                    <span className="text-[8px] font-semibold text-yellow-600 tracking-wider uppercase leading-none mt-0.5">Администратор</span>
                  ) : (
                    <span className="text-[8px] text-[#8a8883] font-semibold tracking-wider uppercase leading-none mt-0.5">Кабинет</span>
                  )}
                </div>
              </Link>

              {/* Logout button */}
              <button 
                onClick={handleLogout} 
                className="w-9 h-9 bg-[#42403a] hover:bg-black text-white rounded-full transition-colors flex items-center justify-center shrink-0 shadow-sm"
                title="Выйти"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link href="/auth" className="hover:text-foreground transition-colors">
              Войти
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 px-6 md:px-16 py-8 md:py-12 w-full max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-12 md:mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="font-serif italic text-5xl md:text-8xl leading-[1.1] mb-6 md:mb-8 text-foreground tracking-tight">
              {activeTab === "recipes" ? (
                <>Рекомендуемые <br className="hidden md:block"/>рецепты</>
              ) : (
                <>Обучающие <br className="hidden md:block"/>курсы</>
              )}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] leading-loose text-muted-foreground font-medium max-w-sm">
              {activeTab === "recipes" 
                ? "КУРАТОРСКИЕ КУЛИНАРНЫЕ ВПЕЧАТЛЕНИЯ ОТ ЛУЧШИХ ШЕФ-ПОВАРОВ, МГНОВЕННО РАЗБЛОКИРОВАННЫЕ ДЛЯ ВАШЕЙ КУХНИ."
                : "ПОЛНОЦЕННЫЕ УЧЕБНЫЕ КУРСЫ С ПОШАГОВЫМИ ВИДЕОУРОКАМИ И ПРИВЯЗАННЫМИ ТЕХНИЧЕСКИМИ КАРТАМИ."
              }
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
                href={activeTab === "recipes" ? "/cabinet/create" : "/cabinet/courses/create"}
                className="w-12 h-12 rounded-full bg-[#35332f] text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <Plus size={20} />
              </Link>
            )}
            {activeTab === "recipes" && (
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isFilterOpen 
                    ? "bg-[#2d2c2a] text-white shadow-md shadow-black/5" 
                    : "border border-border bg-transparent text-foreground hover:bg-muted"
                }`}
              >
                <Filter size={18} fill={isFilterOpen ? "currentColor" : "none"} />
              </button>
            )}
            <button className="w-12 h-12 rounded-full border border-border bg-transparent text-foreground flex items-center justify-center hover:bg-muted transition-colors">
              <ShoppingBag size={18} />
            </button>
          </motion.div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e2e0d8] mb-12">
          <button 
            onClick={() => {
              setActiveTab("recipes");
              setIsFilterOpen(false);
            }}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 mr-8 cursor-pointer ${
              activeTab === "recipes" 
                ? "border-[#2d2c2a] text-[#2d2c2a] border-b-2" 
                : "border-transparent text-[#8a8883] hover:text-[#2d2c2a]"
            }`}
          >
            Рецепты
          </button>
          <button 
            onClick={() => {
              setActiveTab("courses");
              setIsFilterOpen(false);
            }}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 cursor-pointer ${
              activeTab === "courses" 
                ? "border-[#2d2c2a] text-[#2d2c2a] border-b-2" 
                : "border-transparent text-[#8a8883] hover:text-[#2d2c2a]"
            }`}
          >
            Курсы
          </button>
        </div>

        {/* Category Filter Bar */}
        <AnimatePresence>
          {activeTab === "recipes" && isFilterOpen && recipes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 40 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 md:-mx-16 md:px-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {["Все", ...DISH_CATEGORIES].map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-[#2d2c2a] text-white shadow-md shadow-black/5"
                          : "bg-[#f5f4f0] text-[#8a8883] hover:text-[#2d2c2a] hover:bg-[#eae8e1] border border-[#f1f0e9]"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        {activeTab === "recipes" ? (
          recipes.length === 0 ? (
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
          ) : filteredRecipes.length === 0 ? (
            /* Empty Filter State */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-24 rounded-[2.5rem] border border-dashed border-[#e2e0d8] bg-[#fcfcf9] flex flex-col items-center justify-center text-center"
            >
              <ChefHat size={40} className="text-[#e2e0d8] mb-4" strokeWidth={1.5} />
              <h2 className="font-serif italic text-2xl mb-2 text-[#2d2c2a]">Рецепты не найдены</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-[#8a8883] font-medium">
                В категории «{selectedCategory}» пока нет добавленных рецептов.
              </p>
            </motion.div>
          ) : (
            /* Recipes Grid */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredRecipes.map((recipe, index) => (
                <motion.div 
                  key={recipe.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="group relative"
                >
                  <Link href={`/recipe/${recipe.slug || recipe.id}`} className="block">
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
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 font-medium">
                          {recipe.category ? recipe.category.split(', ').join(' • ') : ''}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-foreground whitespace-nowrap mt-1">{recipe.price} ₽</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          courses.length === 0 ? (
            /* Courses Empty State */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-32 rounded-[2.5rem] border border-dashed border-border bg-background flex flex-col items-center justify-center text-center"
            >
              <ChefHat size={48} className="text-border mb-6" strokeWidth={1.5} />
              <h2 className="font-serif italic text-3xl mb-4 text-foreground">Курсы обновляются</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-medium">
                Обучающие курсы скоро появятся в архиве.
              </p>
            </motion.div>
          ) : (
            /* Courses Grid */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {courses.map((course, index) => (
                <motion.div 
                  key={course.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="group relative"
                >
                  <Link href={`/course/${course.slug || course.id}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted mb-6">
                      <Image
                        src={course.image_url || "/scallop.png"}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                    
                    <div className="flex justify-between items-start px-2">
                      <div>
                        <h2 className="font-serif italic text-2xl mb-2 text-foreground group-hover:opacity-70 transition-opacity">{course.title}</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 font-medium">
                          ОБУЧАЮЩИЙ КУРС • {course.lessons_count} {course.lessons_count === 1 ? 'УРОК' : (course.lessons_count > 1 && course.lessons_count < 5) ? 'УРОКА' : 'УРОКОВ'}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-foreground whitespace-nowrap mt-1">{course.price} ₽</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )
        )}
      </section>
      
      {/* Footer */}
      <footer className="mt-24 border-t border-border bg-[#f1f0e9] px-8 md:px-16 py-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity mb-8">
              <ChefHat size={20} className="text-foreground" />
              <span className="font-serif italic text-lg">В гостях у Лидии</span>
            </Link>
            <p className="text-[10px] uppercase tracking-widest leading-loose text-muted-foreground max-w-xs font-medium">
              ИСКЛЮЧИТЕЛЬНЫЕ КУЛИНАРНЫЕ<br/>ТЕХНИЧЕСКИЕ ФАЙЛЫ ДЛЯ СОВРЕМЕННОГО<br/>ПРИГОТОВЛЕНИЯ ЕДЫ.
            </p>
          </div>
          
          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="text-[10px] text-border mb-2 text-foreground">НАВИГАЦИЯ</span>
            <Link href="/" className="hover:text-foreground transition-colors">Каталог</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">Обо мне</Link>
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
