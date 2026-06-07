"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChefHat, Plus, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { getPurchasedRecipesAction } from "../actions/getPurchasedRecipes";
import { subscribeAction, cancelSubscriptionAction } from "../actions/subscription";
import { getAdminStatsAction, grantSubscriptionAction } from "../actions/admin";

export default function CabinetPage() {
  const { data: session, status } = useSession();
  const [purchasedRecipes, setPurchasedRecipes] = useState<any[]>([]);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [submittingSubscription, setSubmittingSubscription] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const user = session?.user;
  const role = (session?.user as any)?.role || "user";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated") {
      async function loadData() {
        const result = await getPurchasedRecipesAction();
        if (result.success) {
          setPurchasedRecipes(result.recipes || []);
          setSubscriptionExpiresAt(result.subscriptionExpiresAt || null);
        }

        const currentRole = (session?.user as any)?.role || "user";
        if (currentRole === "admin") {
          setLoadingAdmin(true);
          const adminResult = await getAdminStatsAction();
          if (adminResult.success) {
            setAdminData(adminResult);
          }
          setLoadingAdmin(false);
        }
        setLoading(false);
      }
      loadData();
    }
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const handleSubscribe = async () => {
    try {
      setSubmittingSubscription(true);
      const res = await subscribeAction();
      if (res.success) {
        setSubscriptionExpiresAt((res.expiresAt as Date).toISOString());
        alert("Подписка успешно оформлена!");
        router.refresh();
      } else {
        alert("Ошибка: " + res.error);
      }
    } catch (e: any) {
      alert("Неожиданная ошибка: " + e.message);
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Вы действительно хотите сбросить подписку для тестирования?")) return;
    try {
      setSubmittingSubscription(true);
      const res = await cancelSubscriptionAction();
      if (res.success) {
        setSubscriptionExpiresAt(null);
        alert("Подписка успешно аннулирована!");
        router.refresh();
      } else {
        alert("Ошибка: " + res.error);
      }
    } catch (e: any) {
      alert("Неожиданная ошибка: " + e.message);
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const isSubscriptionActive = subscriptionExpiresAt 
    ? new Date(subscriptionExpiresAt) > new Date()
    : false;

  const handleAdminGrantSubscription = async (userId: string, days: number) => {
    try {
      const res = await grantSubscriptionAction(userId, days);
      if (res.success) {
        alert(days > 0 ? "Подписка успешно выдана!" : "Подписка успешно аннулирована!");
        
        // Reload admin data
        const adminResult = await getAdminStatsAction();
        if (adminResult.success) {
          setAdminData(adminResult);
        }
        
        // Update current user's session state if it was their account
        if (userId === (session?.user as any).id) {
          setSubscriptionExpiresAt(res.expiresAt ? (res.expiresAt as Date).toISOString() : null);
        }
        router.refresh();
      } else {
        alert("Ошибка: " + res.error);
      }
    } catch (e: any) {
      alert("Неожиданная ошибка: " + e.message);
    }
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
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-[10px] uppercase tracking-widest font-medium text-[#8a8883] hover:text-[#2d2c2a] transition-colors">
            Обо мне
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
          >
            <LogOut size={14} />
            Выйти
          </button>
        </div>
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

        {/* Раздел подписки */}
        <div className="mb-12 p-8 rounded-[2rem] bg-white border border-[#e2e0d8] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f6f5f0] flex items-center justify-center text-[#2d2c2a]">
              <ChefHat size={22} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-widest font-bold text-[#2d2c2a] mb-1">
                Ежемесячная подписка «В гостях у Лидии» Premium
              </h3>
              <p className="text-xs text-[#8a8883] font-light">
                {isSubscriptionActive 
                  ? `Активна до ${new Date(subscriptionExpiresAt!).toLocaleDateString("ru-RU")}`
                  : "Дает полный доступ ко всем рецептам с пометкой «Доступен по подписке»."
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSubscriptionActive ? (
              <button 
                onClick={handleCancelSubscription}
                disabled={submittingSubscription}
                className="bg-transparent border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors px-6 py-3 rounded-full text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
              >
                Сбросить подписку (тест)
              </button>
            ) : (
              <button 
                onClick={handleSubscribe}
                disabled={submittingSubscription}
                className="bg-[#2d2c2a] text-white hover:bg-black transition-colors px-8 py-3.5 rounded-full text-[10px] font-semibold uppercase tracking-widest shadow-sm disabled:opacity-50"
              >
                Оформить подписку за 499 ₽/мес
              </button>
            )}
          </div>
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

        {/* Панель администратора (только для админов) */}
        {role === "admin" && (
          <div className="mt-24 pt-12 border-t border-[#e2e0d8]">
            <h2 className="font-serif italic text-4xl mb-2">Панель администратора</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8883] font-medium mb-12">
              Управление пользователями и статистика
            </p>

            {loadingAdmin || !adminData ? (
              <div className="w-full py-12 text-center text-xs uppercase tracking-widest text-[#8a8883] animate-pulse">
                Загрузка статистики...
              </div>
            ) : (
              <div className="space-y-12">
                {/* Карточки статистики */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-[#e2e0d8] shadow-sm">
                    <span className="text-[10px] uppercase tracking-widest text-[#8a8883] block mb-2 font-medium">Всего рецептов</span>
                    <span className="text-3xl font-medium text-[#2d2c2a]">{adminData.stats.totalRecipes}</span>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-[#e2e0d8] shadow-sm">
                    <span className="text-[10px] uppercase tracking-widest text-[#8a8883] block mb-2 font-medium">Всего прямых покупок</span>
                    <span className="text-3xl font-medium text-[#2d2c2a]">{adminData.stats.totalPurchases}</span>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-[#e2e0d8] shadow-sm">
                    <span className="text-[10px] uppercase tracking-widest text-[#8a8883] block mb-2 font-medium">Активных подписок</span>
                    <span className="text-3xl font-medium text-[#2d2c2a]">{adminData.stats.activeSubscriptions}</span>
                  </div>
                </div>

                {/* Таблица пользователей */}
                <div className="bg-white rounded-[2rem] border border-[#e2e0d8] shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-[#f1f0e9]">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-[#2d2c2a]">
                      База аккаунтов
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#f1f0e9] text-[10px] uppercase tracking-wider text-[#8a8883]">
                          <th className="py-4 px-8 font-semibold">Email</th>
                          <th className="py-4 px-8 font-semibold">Роль</th>
                          <th className="py-4 px-8 font-semibold">Подписка</th>
                          <th className="py-4 px-8 font-semibold">Купленные рецепты</th>
                          <th className="py-4 px-8 font-semibold text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f0e9] text-xs font-medium text-[#2d2c2a]">
                        {adminData.users.map((u: any) => {
                          const isActive = u.subscriptionExpiresAt 
                            ? new Date(u.subscriptionExpiresAt) > new Date()
                            : false;
                          
                          return (
                            <tr key={u.id} className="hover:bg-[#fcfcf9] transition-colors">
                              <td className="py-5 px-8 font-mono">{u.email}</td>
                              <td className="py-5 px-8">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                  u.role === 'admin' 
                                    ? 'text-yellow-700 bg-yellow-50 border border-yellow-100' 
                                    : 'text-gray-600 bg-gray-50 border border-gray-100'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-5 px-8">
                                {isActive ? (
                                  <span className="text-green-600 font-semibold">
                                    Активна до {new Date(u.subscriptionExpiresAt).toLocaleDateString("ru-RU")}
                                  </span>
                                ) : (
                                  <span className="text-[#8a8883] font-light">Нет</span>
                                )}
                              </td>
                              <td className="py-5 px-8 max-w-xs truncate" title={u.purchasedRecipes.join(", ") || "Нет покупок"}>
                                {u.purchasedRecipes.length > 0 ? (
                                  <span className="text-[#2d2c2a] font-light font-sans">
                                    {u.purchasedRecipes.join(", ")}
                                  </span>
                                ) : (
                                  <span className="text-[#8a8883] font-light">—</span>
                                )}
                              </td>
                              <td className="py-5 px-8 text-right space-x-2 whitespace-nowrap">
                                {isActive ? (
                                  <button
                                    onClick={() => handleAdminGrantSubscription(u.id, 0)}
                                    className="text-[9px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-50"
                                  >
                                    Забрать подписку
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdminGrantSubscription(u.id, 30)}
                                    className="text-[9px] uppercase tracking-wider font-bold text-[#2d2c2a] hover:bg-[#2d2c2a] hover:text-white transition-colors px-4 py-1.5 rounded-full border border-[#2d2c2a]"
                                  >
                                    Выдать подписку
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
