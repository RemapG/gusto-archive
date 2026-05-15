-- Установка часового пояса и расширений (если требуется)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица профилей (связана с auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Таблица рецептов (Витрина)
CREATE TABLE public.recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Таблица содержимого рецептов (Скрытая часть: Ингредиенты и Шаги)
CREATE TABLE public.recipe_contents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb, -- массив строк или объектов
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- массив строк или объектов
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Таблица покупок (Связь пользователь - рецепт)
CREATE TABLE public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, recipe_id)
);

-- Настройка Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Политики для профилей
CREATE POLICY "Пользователи могут видеть свой профиль" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Админы могут видеть все профили"
ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Триггер для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Политики для витрины рецептов
CREATE POLICY "Все могут смотреть витрину" 
ON public.recipes FOR SELECT USING (true);

CREATE POLICY "Только админы могут добавлять рецепты" 
ON public.recipes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Только админы могут изменять рецепты" 
ON public.recipes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Только админы могут удалять рецепты" 
ON public.recipes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Политики для содержимого рецептов
CREATE POLICY "Пользователи могут смотреть купленные рецепты" 
ON public.recipe_contents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.purchases WHERE user_id = auth.uid() AND recipe_id = public.recipe_contents.recipe_id)
  OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Только админы могут управлять содержимым" 
ON public.recipe_contents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Политики для покупок (имитация - пользователи могут "покупать" сами)
CREATE POLICY "Пользователи видят свои покупки" 
ON public.purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Админы видят все покупки" 
ON public.purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Авторизованные пользователи могут совершать покупки" 
ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Создание storage bucket для изображений
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Все могут смотреть картинки"
ON storage.objects FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Админы могут загружать картинки"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'recipe-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
