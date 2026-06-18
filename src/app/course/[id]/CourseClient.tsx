"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { deleteCourseAction } from "../../actions/deleteCourse";
import { createCoursePurchaseAction } from "../../actions/createCoursePurchase";
import { getVideoEmbedUrl } from "../../../lib/video";

export default function CourseClient({
  initialCourse,
  courseId,
  initialHasAccess
}: {
  initialCourse: any;
  courseId: string;
  initialHasAccess: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const course = initialCourse;
  const [hasAccess, setHasAccess] = useState(initialHasAccess);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const role = (session?.user as any)?.role || "user";

  const handlePurchase = async () => {
    if (!session) {
      router.push("/auth");
      return;
    }

    try {
      setIsPurchasing(true);
      const result = await createCoursePurchaseAction(courseId);
      if (result.success) {
        setHasAccess(true);
        alert("Курс успешно приобретен! Доступ к урокам и рецептам открыт.");
      } else {
        alert("Ошибка при покупке: " + result.error);
      }
    } catch (err: any) {
      alert("Ошибка при покупке: " + err.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите навсегда удалить этот обучающий курс?")) return;

    try {
      setIsDeleting(true);
      const result = await deleteCourseAction(courseId);
      if (result.success) {
        alert("Курс успешно удален.");
        router.push("/");
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert("Ошибка при удалении: " + err.message);
      setIsDeleting(false);
    }
  };

  const toggleLesson = (lessonId: string) => {
    if (!hasAccess) return;
    setExpandedLessonId(expandedLessonId === lessonId ? null : lessonId);
  };

  return (
    <main className="min-h-screen bg-[#fcfcf9] text-[#2d2c2a] selection:bg-[#e8e6df] pb-32 font-sans">
      {/* Top Header */}
      <header className="px-4 py-4 md:px-16 md:py-8 w-full flex justify-between items-center bg-[#fcfcf9]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#f1f0e9]">
        <Link href="/" className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#8a8883] hover:text-[#2d2c2a] transition-colors font-semibold">
          <ArrowLeft size={16} className="mr-2" />
          <span>В гостях у Лидии</span>
        </Link>

        {role === 'admin' && (
          <div className="flex items-center gap-4">
            <Link 
              href={`/cabinet/courses/edit/${courseId}`}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
            >
              <Edit2 size={12} />
              <span>Редактировать</span>
            </Link>
            <div className="w-[1px] h-3 bg-[#e2e0d8]" />
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? "Удаление..." : "Удалить курс"}</span>
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-16 pt-10 md:pt-16 pb-16 md:pb-24 border-b border-[#f1f0e9]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 md:gap-20">
          <div className="max-w-4xl flex-1">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] md:text-[10px] text-[#8a8883] uppercase tracking-[0.3em] mb-4 md:mb-6 font-bold"
            >
              ОБУЧАЮЩИЙ КУРС • {course.lessons.length} {course.lessons.length === 1 ? 'УРОК' : (course.lessons.length > 1 && course.lessons.length < 5) ? 'УРОКА' : 'УРОКОВ'}
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-8xl font-serif italic tracking-tight leading-[1.2] md:leading-[1.1] mb-8 md:mb-12 text-[#2d2c2a]"
            >
              {course.title}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12"
            >
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-[#8a8883] mb-1">Стоимость обучения</span>
                <span className="text-xl md:text-2xl font-medium">{course.price} ₽</span>
              </div>
              <div className="hidden md:block h-10 w-[1px] bg-[#e2e0d8]" />
              <p className="text-xs text-[#8a8883] font-medium leading-relaxed max-w-md uppercase tracking-wider">
                {course.description}
              </p>
            </motion.div>
          </div>

          {course.imageUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-full lg:w-[400px] aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl shadow-black/5 border border-[#f1f0e9]"
            >
              <Image 
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover"
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Curriculum & Included Recipes */}
      <div className="max-w-[1400px] mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-20">
        
        {/* Left Column: Bundled Recipes */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 text-[#8a8883] flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#e2e0d8]" />
              Включенные рецепты
            </h3>

            {course.recipes.length === 0 ? (
              <p className="text-xs text-[#8a8883] font-medium italic">К этому курсу не привязаны рецепты.</p>
            ) : (
              <div className="space-y-6">
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#8a8883] leading-relaxed">
                  При покупке курса вы автоматически разблокируете постоянный доступ к следующим техкартам:
                </p>
                <ul className="space-y-4">
                  {course.recipes.map((r: any) => (
                    <li key={r.id} className="border-b border-[#f1f0e9] pb-4">
                      <Link 
                        href={`/recipe/${r.slug || r.id}`}
                        className="group flex flex-col hover:opacity-75 transition-opacity"
                      >
                        <span className="text-sm font-semibold text-[#2d2c2a] font-serif italic">{r.title}</span>
                        <span className="text-[9px] uppercase tracking-widest text-[#8a8883] mt-1">
                          {r.category ? r.category.split(', ').join(' • ') : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lock/Purchase Panel if no access */}
            {!hasAccess && (
              <div className="bg-[#f6f5f0] p-10 rounded-[2rem] border border-[#f1f0e9] mt-12">
                 <Lock className="text-[#8a8883] mb-6" size={24} />
                 <p className="text-xs font-medium uppercase tracking-widest leading-loose text-[#8a8883] mb-8">
                   ПРОГРАММА ОБУЧЕНИЯ И ВСЕ УРОКИ ЗАБЛОКИРОВАНЫ.
                 </p>
                 <button 
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full bg-[#2d2c2a] text-white hover:bg-black transition-all py-5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-black/5 active:scale-95 disabled:opacity-50"
                >
                  {isPurchasing ? "Обработка..." : `Разблокировать за ${course.price} ₽`}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Lessons list */}
        <div className="lg:col-span-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 text-[#8a8883] flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#e2e0d8]" />
            Программа обучения
          </h3>

          {course.lessons.length === 0 ? (
            <div className="w-full py-16 rounded-[2rem] border border-dashed border-[#e2e0d8] text-center text-xs text-[#8a8883] font-medium">
              В этом курсе пока нет уроков.
            </div>
          ) : (
            <div className="space-y-6">
              {course.lessons.map((lesson: any, i: number) => {
                const isExpanded = expandedLessonId === lesson.id;
                
                return (
                  <div 
                    key={lesson.id} 
                    className={`border border-[#f1f0e9] rounded-[2rem] overflow-hidden transition-all duration-300 ${
                      hasAccess 
                        ? "bg-white hover:border-[#2d2c2a]/30" 
                        : "bg-[#fcfcf9]/50 opacity-80"
                    }`}
                  >
                    {/* Header */}
                    <div 
                      onClick={() => toggleLesson(lesson.id)}
                      className={`p-6 md:p-8 flex items-center justify-between ${
                        hasAccess ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-serif italic text-[#8a8883] leading-none select-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4 className="text-base font-semibold text-[#2d2c2a]">{lesson.title}</h4>
                        </div>
                      </div>

                      <div>
                        {hasAccess ? (
                          isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                        ) : (
                          <Lock size={16} className="text-[#8a8883]" />
                        )}
                      </div>
                    </div>

                    {/* Lesson Content Area */}
                    {hasAccess && (
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-[#f1f0e9]"
                          >
                            <div className="p-6 md:p-8 bg-[#fcfcf9] space-y-6">
                              {lesson.description && (
                                <p className="text-sm text-[#4a4945] font-light leading-relaxed whitespace-pre-wrap">
                                  {lesson.description}
                                </p>
                              )}

                              {lesson.videoUrl && (
                                <div className="w-full">
                                  {(() => {
                                    const embedUrl = getVideoEmbedUrl(lesson.videoUrl);
                                    if (embedUrl) {
                                      return (
                                        <div className="relative w-full aspect-video rounded-[1.5rem] overflow-hidden bg-[#2d2c2a] border border-[#f1f0e9] shadow-lg">
                                          <iframe
                                            src={embedUrl}
                                            className="absolute inset-0 w-full h-full"
                                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                            allowFullScreen
                                            frameBorder="0"
                                          />
                                        </div>
                                      );
                                    }
                                    return (
                                      <p className="text-[10px] text-red-400">Некорректная ссылка на видео</p>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
