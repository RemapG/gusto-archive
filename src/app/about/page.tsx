"use client";

import Link from "next/link";
import { ChefHat, Send, Mail, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] font-sans flex flex-col">
      {/* Header */}
      <header className="px-4 py-6 md:px-16 w-full mx-auto flex justify-between items-center bg-[#fcfcf9] z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ChefHat size={24} className="text-[#2d2c2a]" />
          <span className="font-serif italic text-xl md:text-2xl tracking-wide">В гостях у Лидии</span>
        </Link>
        
        <div className="flex items-center text-[10px] uppercase tracking-widest font-medium text-[#8a8883] gap-6">
          <Link href="/" className="hover:text-[#2d2c2a] transition-colors">
            Каталог
          </Link>
          <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">
            Кабинет
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 px-8 md:px-16 py-12 md:py-20 w-full max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-16">
          {/* Left Column: Image */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[450px] flex-shrink-0"
          >
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-[#f6f5f0] border border-[#e2e0d8] shadow-2xl shadow-black/5">
              <Image
                src="/lida.jpg"
                alt="Лидия"
                fill
                priority
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* Right Column: Bio Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 max-w-2xl pt-4"
          >
            <span className="text-[10px] text-[#8a8883] uppercase tracking-[0.3em] font-bold block mb-4">
              О СВЯЗИ И ВДОХНОВЕНИИ • ОБ АВТОРЕ
            </span>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[1.15] mb-8 text-[#2d2c2a]">
              Лидия
            </h1>
            
            <div className="space-y-6 text-[#2d2c2a] font-light leading-relaxed text-sm md:text-base">
              <p>
                Меня зовут Лидия. Я готовлю с детства, но осознанно пришла на кухню 15 лет назад. Пройдя путь от кондитера с собственной кондитерской до стажировок в топовых ресторанах Петербурга и Москвы (Harvest, Animals, Savva), я поняла главное: настоящий вкус рождается в чистоте продукта и понимании его индивидуальности.
              </p>
              <p>
                Моя философия — авторская свобода. Я не привязываюсь к географии, но уважаю сезонность. Каждый рецепт здесь — это не просто инструкция, это история, которую я прожила на кухне, чтобы поделиться ею с тобой.
              </p>
            </div>

            {/* Social / Contact Links */}
            <div className="mt-12 pt-8 border-t border-[#e2e0d8] flex flex-wrap gap-6 text-[10px] uppercase tracking-widest font-semibold text-[#8a8883]">
              <a href="#" className="flex items-center gap-2 hover:text-[#2d2c2a] transition-colors">
                <Globe size={14} /> Instagram
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-[#2d2c2a] transition-colors">
                <Send size={14} /> Telegram
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-[#2d2c2a] transition-colors">
                <Mail size={14} /> Email
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#e2e0d8] bg-[#f1f0e9] px-8 md:px-16 py-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity mb-6">
              <ChefHat size={20} className="text-[#2d2c2a]" />
              <span className="font-serif italic text-lg">В гостях у Лидии</span>
            </Link>
            <p className="text-[10px] uppercase tracking-widest leading-loose text-[#8a8883] max-w-xs font-medium">
              ИСКЛЮЧИТЕЛЬНЫЕ КУЛИНАРНЫЕ<br/>ТЕХНИЧЕСКИЕ ФАЙЛЫ ДЛЯ СОВРЕМЕННОГО<br/>ПРИГОТОВЛЕНИЯ ЕДЫ.
            </p>
          </div>
          
          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-[#8a8883]">
            <span className="text-[10px] text-border mb-2 text-[#2d2c2a]">НАВИГАЦИЯ</span>
            <Link href="/" className="hover:text-[#2d2c2a] transition-colors">Каталог</Link>
            <Link href="/about" className="hover:text-[#2d2c2a] transition-colors">Обо мне</Link>
            <Link href="/cabinet" className="hover:text-[#2d2c2a] transition-colors">Кабинет</Link>
          </div>

          <div className="col-span-1 flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-[#8a8883]">
            <span className="text-[10px] text-border mb-2 text-[#2d2c2a]">ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ</span>
            <Link href="#" className="hover:text-[#2d2c2a] transition-colors">Условия использования</Link>
            <Link href="#" className="hover:text-[#2d2c2a] transition-colors">Конфиденциальность</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
