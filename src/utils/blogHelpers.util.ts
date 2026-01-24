import { IBlogPost, IPromptSnippet } from '../types/blog.types.js';

/**
 * Formats prompt snippet into copyable text
 */
export function formatPromptForCopy(snippet: IPromptSnippet): string {
  let formatted = '';

  if (snippet.systemInstruction) {
    formatted += `# SYSTEM INSTRUCTION\n${snippet.systemInstruction}\n\n`;
  }

  if (snippet.constraints && snippet.constraints.length > 0) {
    formatted += `# CONSTRAINTS\n`;
    snippet.constraints.forEach((constraint) => {
      formatted += `- ${constraint}\n`;
    });
    formatted += '\n';
  }

  if (snippet.examples && snippet.examples.length > 0) {
    formatted += `# EXAMPLES\n`;
    snippet.examples.forEach((example, idx) => {
      formatted += `${idx + 1}. ${example}\n`;
    });
    formatted += '\n';
  }

  // Add any additional content
  if (snippet.additionalContent) {
    Object.entries(snippet.additionalContent).forEach(([key, value]) => {
      formatted += `# ${key.toUpperCase()}\n${value}\n\n`;
    });
  }

  return formatted.trim();
}

/**
 * Calculates trending score for a blog post
 * Higher score = more trending
 */
export function calculateTrendingScore(
  blog: IBlogPost,
  timeframeHours: number = 168, // 7 days default
): number {
  const now = Date.now();
  const publishTime = blog.publishDate.getTime();
  const ageHours = (now - publishTime) / (1000 * 60 * 60);

  // Don't include if older than timeframe
  if (ageHours > timeframeHours) return 0;

  // Weighted scoring
  const likeWeight = 3;
  const shareWeight = 5;
  const viewWeight = 1;

  const engagementScore =
    blog.likes.length * likeWeight +
    blog.shares * shareWeight +
    blog.views * viewWeight;

  // Decay factor (newer posts get boost)
  // Uses exponential decay: e^(-x)
  const decayFactor = Math.exp(-ageHours / (timeframeHours / 2));

  return engagementScore * decayFactor;
}

/**
 * Sanitizes blog content to prevent XSS
 * Note: Should be used in conjunction with DOMPurify for HTML content
 */
export function sanitizeBlogContent(content: string): string {
  // Basic XSS prevention
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

