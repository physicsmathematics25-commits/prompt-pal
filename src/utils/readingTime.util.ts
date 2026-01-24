import { IBlogSection } from '../types/blog.types.js';
import { extractPlainText } from './slug.util.js';

const WORDS_PER_MINUTE = 200;
const CODE_READING_MULTIPLIER = 0.5; // Code/technical content is read slower

/**
 * Calculates estimated reading time for blog sections
 * Returns reading time in minutes (minimum 1 minute)
 */
export function calculateReadingTime(sections: IBlogSection[]): number {
  let totalWords = 0;

  sections.forEach((section) => {
    // Count words in section content
    const plainText = extractPlainText(section.content);
    const contentWords = plainText.split(/\s+/).filter((word) => word.length > 0)
      .length;
    totalWords += contentWords;

    // Count words in prompt snippet if present
    if (section.promptSnippet?.fullPromptText) {
      const promptWords = extractPlainText(section.promptSnippet.fullPromptText)
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      
      // Apply multiplier for technical/code content
      totalWords += Math.ceil(promptWords * CODE_READING_MULTIPLIER);
    }

    // Count words in image captions
    if (section.image?.caption) {
      const captionWords = section.image.caption
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      totalWords += captionWords;
    }
  });

  const readingTime = Math.ceil(totalWords / WORDS_PER_MINUTE);

  // Ensure minimum 1 minute
  return Math.max(readingTime, 1);
}

/**
 * Formats reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "8 min read")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min read`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr read`;
  }

  return `${hours} hr ${remainingMinutes} min read`;
}

