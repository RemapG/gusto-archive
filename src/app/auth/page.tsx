"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUserAction } from "../actions/register";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        
        const result = await registerUserAction(formData);
        if (result.success) {
          // Auto login after registration
          const loginResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (loginResult?.ok) {
            router.push("/cabinet");
            router.refresh();
          }
        } else {
          setError(result.error || "Ошибка регистрации");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Неверный email или пароль");
        } else {
          router.push("/cabinet");
          router.refresh();
        }
      }
    } catch (err) {
      setError("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f5f0] flex flex-col items-center justify-center p-6 selection:bg-[#e8e6df]">
      {/* Logo and Brand */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <Link href="/" className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#2d2c2a] rounded-full flex items-center justify-center shadow-2xl">
            <ChefHat size={32} className="text-[#f6f5f0]" />
          </div>
          <div>
            <h1 className="font-serif italic text-4xl tracking-tight text-[#2d2c2a]">Gusto</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#8a8883] font-bold mt-1">Архив Техкарт</p>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 md:p-12 border border-[#f1f0e9]"
      >
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-serif italic text-[#2d2c2a] mb-2">
            {isRegister ? "Создать аккаунт" : "Добро пожаловать"}
          </h2>
          <p className="text-[10px] text-[#8a8883] uppercase tracking-widest font-bold">
            {isRegister ? "ПРИСОЕДИНЯЙТЕСЬ К ГАСТРОНОМИЧЕСКОМУ АРХИВУ" : "ВОЙДИТЕ ДЛЯ ДОСТУПА К КОЛЛЕКЦИИ"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[#8a8883] font-bold ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#8a8883] group-focus-within:text-[#2d2c2a] transition-colors">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="chef@gusto.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#fcfcf9] border border-[#f1f0e9] rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-[#2d2c2a] focus:ring-4 focus:ring-[#2d2c2a]/5 transition-all placeholder:text-[#c4c2ba]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-[#8a8883] font-bold ml-1">Пароль</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#8a8883] group-focus-within:text-[#2d2c2a] transition-colors">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#fcfcf9] border border-[#f1f0e9] rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-[#2d2c2a] focus:ring-4 focus:ring-[#2d2c2a]/5 transition-all placeholder:text-[#c4c2ba]"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-3 text-red-500 bg-red-50 p-4 rounded-2xl text-xs border border-red-100 font-medium"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2d2c2a] text-[#f6f5f0] rounded-2xl py-5 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
          >
            {loading ? (isRegister ? "Создаем..." : "Входим...") : (isRegister ? "Зарегистрироваться" : "Получить доступ")}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-center pt-4">
            <button 
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-bold underline underline-offset-4 decoration-[#f1f0e9]"
            >
              {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Создать"}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 text-[10px] uppercase tracking-widest text-[#8a8883] font-medium"
      >
        Gusto Culinary Boutique © 2026
      </motion.p>
    </main>
  );
}
