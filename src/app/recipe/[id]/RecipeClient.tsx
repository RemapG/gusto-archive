"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2, Trash2, ChefHat, Edit2, MessageSquare } from "lucide-react";
import { deleteRecipeAction } from "../../actions/deleteRecipe";
import { getRecipeContentAction } from "../../actions/getRecipeContent";
import { createPurchaseAction } from "../../actions/createPurchase";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TimerButton from "../../../components/TimerButton";
import { getVideoEmbedUrl } from "../../../lib/video";
import { getCommentsAction, addCommentAction, deleteCommentAction } from "../../actions/comments";


export default function RecipeClient({ initialRecipe, recipeId }: { initialRecipe: any, recipeId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const recipe = initialRecipe;
  const [content, setContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [purchased, setPurchased] = useState<boolean | null>(null); // null = checking, true = yes, false = no
  const [hasAccess, setHasAccess] = useState<boolean | null>(null); // null = checking, true = yes, false = no
  const [isDeleting, setIsDeleting] = useState(false);

  const role = (session?.user as any)?.role || "user";

  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    async function loadComments() {
      try {
        const res = await getCommentsAction(recipeId);
        if (res.success && res.comments) {
          setComments(res.comments);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
    loadComments();
  }, [recipeId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await addCommentAction(recipeId, commentText);
      if (res.success && res.comment) {
        setComments((prev) => [res.comment, ...prev]);
        setCommentText("");
      } else {
        setCommentError(res.error || "Не удалось отправить комментарий");
      }
    } catch (err: any) {
      setCommentError(err.message || "Ошибка соединения");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Удалить этот комментарий?")) return;

    try {
      const res = await deleteCommentAction(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert("Ошибка при удалении: " + res.error);
      }
    } catch (err: any) {
      alert("Ошибка при удалении: " + err.message);
    }
  };

  useEffect(() => {
    async function checkAccess() {
      setLoadingContent(true);
      try {
        const result = await getRecipeContentAction(recipeId);
        
        if (result.success && result.content) {
          setContent(result.content);
          setPurchased(result.purchased ?? false);
          setHasAccess(result.hasAccess ?? false);
        } else {
          setContent(null);
          setPurchased(result.purchased ?? false);
          setHasAccess(result.hasAccess ?? false);
        }
      } catch (err) {
        console.error("Error loading recipe contents:", err);
        setContent(null);
        setPurchased(false);
        setHasAccess(false);
      } finally {
        setLoadingContent(false);
      }
    }
    checkAccess();
  }, [recipeId, session]);

  const handlePurchase = async () => {
    if (!session) {
      router.push("/auth");
      return;
    }

    try {
      const result = await createPurchaseAction(recipeId);
      if (result.success) {
        const contentResult = await getRecipeContentAction(recipeId);
        if (contentResult.success) {
          setContent(contentResult.content);
          setPurchased(true);
          setHasAccess(true);
        }
      } else {
        alert("Ошибка при покупке: " + result.error);
      }
    } catch (err: any) {
      alert("Ошибка при покупке: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите навсегда удалить этот рецепт из архива?")) return;

    try {
      setIsDeleting(true);
      const result = await deleteRecipeAction(recipeId);
      if (result.success) {
        alert("Рецепт успешно удален из архива.");
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
          <span className="hidden sm:inline">В гостях у Лидии</span>
          <span className="sm:hidden">Лидия</span>
        </Link>

        {role === 'admin' && (
          <div className="flex items-center gap-4">
            <Link 
              href={`/cabinet/edit/${recipeId}`}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#8a8883] hover:text-[#2d2c2a] transition-colors"
            >
              <Edit2 size={12} />
              <span className="hidden sm:inline">Редактировать</span>
              <span className="sm:hidden">Правка</span>
            </Link>
            <div className="w-[1px] h-3 bg-[#e2e0d8]" />
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">{isDeleting ? "Удаление..." : "Удалить рецепт"}</span>
              <span className="sm:hidden">Удалить</span>
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
              {recipe.category ? recipe.category.split(', ').join(' • ') : ''} • ТЕХНИЧЕСКАЯ КАРТА
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
                {recipe.isFree || recipe.price === 0 ? (
                  <span className="text-xl md:text-2xl font-serif italic text-emerald-800 font-normal">Бесплатно</span>
                ) : (
                  <span className="text-xl md:text-2xl font-medium">{recipe.price} ₽</span>
                )}
              </div>
              <div className="hidden md:block h-10 w-[1px] bg-[#e2e0d8]" />
              <p className="text-xs text-[#8a8883] font-medium leading-relaxed max-w-md uppercase tracking-wider">
                {recipe.description}
              </p>
            </motion.div>
          </div>

          {recipe.imageUrl && !['/placeholder.jpg', '/scallop.png'].includes(recipe.imageUrl) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-full lg:w-[400px] aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl shadow-black/5 border border-[#f1f0e9]"
            >
              <Image 
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </motion.div>
          )}
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
            
            {loadingContent || hasAccess === null ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 bg-[#f1f0e9] rounded w-full" />
                ))}
              </div>
            ) : hasAccess === false ? (
              <div className="bg-[#f6f5f0] p-10 rounded-[2rem] border border-[#f1f0e9]">
                 <Lock className="text-[#8a8883] mb-6" size={24} />
                 <p className="text-xs font-medium uppercase tracking-widest leading-loose text-[#8a8883] mb-8">
                   СПИСОК ИНГРЕДИЕНТОВ И ТОЧНЫЕ ГРАММОВКИ ЗАБЛОКИРОВАНЫ.
                 </p>
                 <button 
                  onClick={handlePurchase}
                  className="w-full bg-[#2d2c2a] text-white hover:bg-black transition-all py-5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-black/5 active:scale-95"
                >
                  Разблокировать за {recipe.price} ₽
                </button>
              </div>
            ) : (
              <div className="space-y-6">
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

                {purchased === false && role !== 'admin' && !recipe.isFree && recipe.price > 0 && (
                  <div className="mt-8 p-6 rounded-2xl bg-[#f6f5f0] border border-[#e2e0d8]">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#8a8883] mb-3 leading-relaxed">
                      Доступ открыт по подписке Premium.
                    </p>
                    <button 
                      onClick={handlePurchase}
                      className="w-full bg-transparent border border-[#2d2c2a] text-[#2d2c2a] hover:bg-[#2d2c2a] hover:text-white transition-all py-3 text-[9px] font-bold uppercase tracking-widest rounded-full"
                    >
                      Купить навсегда за {recipe.price} ₽
                    </button>
                  </div>
                )}

                {(recipe.isFree || recipe.price === 0) && (
                  <div className="mt-8 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Бесплатный рецепт
                    </p>
                    <p className="text-[11px] text-emerald-950/70 mt-1 font-light leading-relaxed">
                      Открыт для всех гостей — даже без регистрации. Приятного приготовления!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Cooking Steps */}
        <div className="lg:col-span-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 text-[#8a8883] flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#e2e0d8]" />
            Процесс приготовления
          </h3>

          {hasAccess && recipe.video_url && (
            <div className="mb-12 animate-fade-in">
              {(() => {
                const embedUrl = getVideoEmbedUrl(recipe.video_url);
                if (embedUrl) {
                  return (
                    <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-[#2d2c2a] border border-[#f1f0e9] shadow-2xl shadow-black/5">
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
                return null;
              })()}
              <div className="w-20 h-[1px] bg-[#f1f0e9] mx-auto mt-12" />
            </div>
          )}

          {loadingContent || hasAccess === null ? (
            <div className="space-y-12 animate-pulse">
              <div className="h-64 bg-[#f1f0e9] rounded-[3rem] w-full" />
              <div className="space-y-4">
                <div className="h-4 bg-[#f1f0e9] rounded w-3/4" />
                <div className="h-4 bg-[#f1f0e9] rounded w-1/2" />
              </div>
            </div>
          ) : hasAccess === false ? (
            <div className="relative aspect-video rounded-[3rem] overflow-hidden group cursor-pointer bg-[#2d2c2a]" onClick={handlePurchase}>
              {recipe.imageUrl && !['/placeholder.jpg', '/scallop.png'].includes(recipe.imageUrl) && (
                <Image 
                  src={recipe.imageUrl} 
                  alt="Locked Content" 
                  fill 
                  className="object-cover blur-md scale-110 opacity-40 grayscale transition-all duration-700 group-hover:scale-100 group-hover:blur-sm" 
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-8">
                 <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6">
                    <Lock size={32} className="text-white" />
                 </div>
                 <h4 className="text-2xl font-serif italic text-white mb-2">Архив закрыт</h4>
                 <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium">Купите доступ или оформите подписку для просмотра техкарты</p>
              </div>
            </div>
          ) : (
            <div className="space-y-24">
              {content?.steps?.map((step: any, i: number) => {
                const stepText = typeof step === 'string' ? step : step.text;
                const stepImage = typeof step === 'object' && step.image_url ? step.image_url : null;
                const stepVideo = typeof step === 'object' && step.video_url ? step.video_url : null;
                
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
                         <p className="text-lg md:text-xl font-light leading-relaxed text-[#2d2c2a] whitespace-pre-wrap">
                           {stepText}
                         </p>
                         {step.timer && step.timer > 0 && (
                           <div className="mt-6">
                             <TimerButton label={`Таймер: ${Math.floor(step.timer / 60)} мин`} seconds={step.timer} />
                           </div>
                         )}
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

                    {stepVideo && (
                      <div className="w-full">
                        {(() => {
                          const embedUrl = getVideoEmbedUrl(stepVideo);
                          if (embedUrl) {
                            return (
                              <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-[#2d2c2a] border border-[#f1f0e9] shadow-2xl shadow-black/5">
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
                          return null;
                        })()}
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

          {/* Comments Section */}
          <div className="mt-24 border-t border-[#f1f0e9] pt-16">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-10 text-[#8a8883] flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#e2e0d8]" />
              Отзывы и комментарии ({comments.length})
            </h3>

            {/* Comment Form */}
            {session ? (
              <form onSubmit={handleSubmitComment} className="mb-12 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#2d2c2a] text-white flex items-center justify-center shrink-0 text-sm font-semibold uppercase">
                    {session.user?.name ? session.user.name.charAt(0) : "U"}
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Поделитесь вашим отзывом или вопросом о рецепте..."
                      rows={3}
                      maxLength={1000}
                      className="w-full px-4 py-3 rounded-2xl bg-[#f6f5f0] border border-[#e2e0d8] focus:border-[#2d2c2a] focus:bg-white outline-none resize-none text-sm transition-all placeholder:text-[#8a8883]"
                    />
                    {commentError && (
                      <p className="text-xs text-red-500 font-medium">{commentError}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#8a8883] font-medium">
                        {commentText.length}/1000 символов
                      </span>
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="bg-[#2d2c2a] text-white hover:bg-black disabled:opacity-40 disabled:hover:bg-[#2d2c2a] transition-all py-3 px-6 text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer"
                      >
                        {submittingComment ? "Отправка..." : "Отправить"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-12 p-6 rounded-[2rem] bg-[#f6f5f0] border border-[#f1f0e9] text-center">
                <p className="text-xs text-[#8a8883] font-medium uppercase tracking-widest leading-loose mb-4">
                  Чтобы оставлять комментарии и делиться своими результатами, пожалуйста, войдите в систему.
                </p>
                <Link
                  href="/auth"
                  className="inline-block bg-transparent border border-[#2d2c2a] text-[#2d2c2a] hover:bg-[#2d2c2a] hover:text-white transition-all py-3 px-8 text-[10px] font-bold uppercase tracking-widest rounded-full"
                >
                  Войти на сайт
                </Link>
              </div>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f1f0e9] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#f1f0e9] rounded w-1/4" />
                      <div className="h-8 bg-[#f1f0e9] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 text-[#8a8883]">
                <MessageSquare className="mx-auto mb-4 text-[#e2e0d8]" size={24} />
                <p className="text-xs font-medium uppercase tracking-widest">Здесь пока нет комментариев. Будьте первыми!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 border-b border-[#f1f0e9] pb-6 last:border-b-0 group">
                    <div className="w-10 h-10 rounded-full bg-[#f1f0e9] overflow-hidden shrink-0 flex items-center justify-center border border-[#e2e0d8]">
                      {comment.user.image ? (
                        <Image
                          src={comment.user.image}
                          alt={comment.user.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold uppercase text-[#8a8883]">
                          {comment.user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-serif italic text-base text-[#2d2c2a] font-medium">
                            {comment.user.name}
                          </span>
                          {comment.user.role === "admin" && (
                            <span className="text-[8px] bg-[#2d2c2a] text-white font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                              Шеф-повар
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8a8883] font-medium">
                          {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-[#2d2c2a] font-light leading-relaxed whitespace-pre-wrap">
                        {comment.text}
                      </p>
                      
                      {/* Delete comment action */}
                      {(session && ((session.user as any).id === comment.userId || (session.user as any).role === "admin")) && (
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-400 hover:text-red-600 transition-colors text-[9px] uppercase tracking-widest font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={10} />
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
