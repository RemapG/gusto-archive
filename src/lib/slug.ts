import { prisma } from "./prisma";

/**
 * Transliterates Russian characters to English and outputs a URL-friendly slug.
 */
export function slugify(text: string): string {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ъ': '', 'ь': ''
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => ru[char as keyof typeof ru] !== undefined ? ru[char as keyof typeof ru] : char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/-+/g, '-');         // Replace duplicate hyphens
}

/**
 * Generates a unique slug for a recipe. If the slug already exists,
 * appends a counter (e.g. idealnyj-grebeshok-1).
 */
export async function generateUniqueSlug(title: string, currentRecipeId?: string): Promise<string> {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = "recipe";
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.recipe.findFirst({
      where: { 
        slug,
        NOT: currentRecipeId ? { id: currentRecipeId } : undefined
      }
    });
    
    if (!existing) {
      break;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Generates a unique slug for a course. If the slug already exists,
 * appends a counter (e.g. konditerskiy-kurs-1).
 */
export async function generateUniqueCourseSlug(title: string, currentCourseId?: string): Promise<string> {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = "course";
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.course.findFirst({
      where: { 
        slug,
        NOT: currentCourseId ? { id: currentCourseId } : undefined
      }
    });
    
    if (!existing) {
      break;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

