/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure a slug is unique by appending a number if needed
 */
export async function ensureUniqueSlug(
  slug: string,
  checkUnique: (slug: string) => Promise<boolean>,
  existingId?: string
): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const exists = await checkUnique(uniqueSlug);
    
    // If checking for update and it's the same ID, it's okay
    if (!exists || (existingId && uniqueSlug === slug)) {
      return uniqueSlug;
    }
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

