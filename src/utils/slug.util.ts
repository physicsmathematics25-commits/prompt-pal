import { Model } from 'mongoose';

/**
 * Generates a URL-friendly slug from a title
 * Ensures uniqueness by appending a counter if needed
 */
export async function generateUniqueSlug(
  title: string,
  model: Model<any>,
  excludeId?: string,
): Promise<string> {
  // Create base slug from title
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Truncate if too long
  if (slug.length > 100) {
    slug = slug.substring(0, 100).replace(/-+$/, '');
  }

  // Check uniqueness
  let uniqueSlug = slug;
  let counter = 1;

  const query: any = { slug: uniqueSlug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  while (await model.findOne(query)) {
    uniqueSlug = `${slug}-${counter}`;
    query.slug = uniqueSlug;
    counter++;
  }

  return uniqueSlug;
}

/**
 * Extracts plain text from HTML/markdown content
 */
export function extractPlainText(content: string): string {
  // Remove HTML tags
  let text = content.replace(/<[^>]*>/g, ' ');
  
  // Remove markdown syntax
  text = text
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/[*_]{1,2}/g, '') // Bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`[^`]+`/g, '') // Inline code
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Images
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

