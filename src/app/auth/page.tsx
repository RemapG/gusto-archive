"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Неверный email или пароль");
      else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
      });
      if (error) setError(error.message);
      else if (data.user && data.user.identities && data.user.identities.length === 0) {
         setError("Пользователь с таким email уже существует");
      }
      else {
        setSuccessMsg("Регистрация успешна! Проверьте вашу почту или войдите.");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#fdfdfd] text-neutral-900 selection:bg-neutral-200 flex flex-col">
      <header className="px-8 py-6 md:px-16 md:py-8 w-full max-w-[1600px] mx-auto absolute top-0 left-0 right-0 z-10">
        <Link href="/" className="inline-flex items-center text-sm uppercase tracking-wider text-neutral-500 hover:text-black transition-colors font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Назад к витрине
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md p-8 md:p-12 border border-neutral-200 bg-white shadow-sm rounded-sm"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light tracking-tight mb-2 uppercase tracking-widest">{isLogin ? "Вход" : "Регистрация"}</h1>
            <p className="text-neutral-500 text-sm font-light">
              {isLogin ? "Добро пожаловать в Atelier" : "Присоединяйтесь к эксклюзивному клубу"}
            </p>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-light rounded-sm border border-red-100">{error}</div>}
          {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-light rounded-sm border border-green-100">{successMsg}</div>}

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2 font-medium">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-b border-neutral-300 py-3 px-1 bg-transparent focus:outline-none focus:border-black transition-colors font-light placeholder-neutral-300 text-lg"
                placeholder="ваша@почта.com"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2 font-medium">Пароль</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border-b border-neutral-300 py-3 px-1 bg-transparent focus:outline-none focus:border-black transition-colors font-light placeholder-neutral-300 text-lg"
                placeholder="••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors py-4 text-sm font-medium uppercase tracking-widest rounded-sm mt-8 disabled:opacity-50"
            >
              {loading ? "Загрузка..." : (isLogin ? "Войти" : "Создать аккаунт")}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-light text-neutral-500">
            {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
              className="text-black hover:underline font-medium uppercase tracking-widest text-xs ml-2"
            >
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
