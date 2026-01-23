/**
 * Prompt Analyzer Utility
 * Analyzes prompts to identify missing elements, grammar issues, and structure problems
 */

/**
 * Pre-validation result for prompts
 */
export interface PromptValidationResult {
  isValid: boolean;
  isAcceptable: boolean; // true if prompt can be optimized, false if completely unacceptable
  validationMessage?: string;
  issues: string[];
}

/**
 * Pre-validate prompt before optimization
 * Checks for obviously unacceptable, nonsensical, or inappropriate prompts
 */
export function preValidatePrompt(prompt: string): PromptValidationResult {
  const trimmed = prompt.trim();
  const issues: string[] = [];
  let isValid = true;
  let isAcceptable = true;
  let validationMessage: string | undefined;

  // Check for empty or too short
  if (trimmed.length === 0) {
    isValid = false;
    isAcceptable = false;
    issues.push('Prompt is empty');
    validationMessage = 'Prompt cannot be empty. Please provide a valid prompt.';
    return { isValid, isAcceptable, validationMessage, issues };
  }

  if (trimmed.length < 2) {
    isValid = true; // Can still optimize
    isAcceptable = true;
    issues.push('Prompt is extremely short');
    validationMessage = 'Prompt is very short. Consider adding more details for better results.';
  }

  // Check for random characters or gibberish (more than 50% non-alphanumeric)
  const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  const nonAlphanumericCount = trimmed.length - alphanumericCount;
  if (trimmed.length > 10 && nonAlphanumericCount / trimmed.length > 0.5) {
    isValid = false;
    isAcceptable = false;
    issues.push('Prompt appears to be gibberish or random characters');
    validationMessage = 'Prompt contains too many non-alphanumeric characters and appears nonsensical.';
    return { isValid, isAcceptable, validationMessage, issues };
  }

  // Check for obvious nonsense patterns
  const nonsensePatterns = [
    /^[^a-zA-Z0-9\s]+$/, // Only special characters
    /(.)\1{10,}/, // Same character repeated 10+ times
    /[a-z]{20,}/i, // Very long word (likely gibberish)
  ];

  for (const pattern of nonsensePatterns) {
    if (pattern.test(trimmed)) {
      isValid = false;
      isAcceptable = false;
      issues.push('Prompt matches nonsense pattern');
      validationMessage = 'Prompt appears to be nonsensical or invalid.';
      return { isValid, isAcceptable, validationMessage, issues };
    }
  }

  // Check for inappropriate content (basic check - can be enhanced)
  const inappropriatePatterns = [
    /\b(hack|exploit|illegal|harmful|violent|explicit)\b/i,
  ];
  
  // Note: This is a basic check. In production, you might want more sophisticated content filtering
  // For now, we'll just flag it but still allow optimization (let AI handle it)
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmed)) {
      issues.push('Potentially inappropriate content detected');
      // Don't block, but note it
    }
  }

  // Check if prompt is too vague (single word, very generic)
  const wordCount = trimmed.split(/\s+/).filter((word) => word.length > 0).length;
  if (wordCount === 1 && trimmed.length < 20) {
    isValid = true;
    isAcceptable = true;
    issues.push('Prompt is very vague');
    validationMessage = 'Prompt is quite vague. Consider adding more details for better optimization results.';
  }

  return { isValid, isAcceptable, validationMessage, issues };
}

export interface PromptAnalysisResult {
  completenessScore: number;
  missingElements: string[];
  grammarFixed: boolean;
  structureImproved: boolean;
  wordCount: number;
  clarityScore: number;
  specificityScore: number;
  structureScore: number;
  issues: string[];
}

/**
 * Analyze a prompt to identify what's missing and what needs improvement
 */
export function analyzePrompt(
  prompt: string,
  mediaType: 'text' | 'image' | 'video' | 'audio',
): PromptAnalysisResult {
  const trimmedPrompt = prompt.trim();
  const wordCount = trimmedPrompt.split(/\s+/).filter((word) => word.length > 0).length;

  // Identify missing elements based on media type
  const missingElements: string[] = [];
  
  if (mediaType === 'image') {
    if (!hasStyle(prompt)) missingElements.push('style');
    if (!hasComposition(prompt)) missingElements.push('composition');
    if (!hasBackground(prompt)) missingElements.push('background');
    if (!hasQualityIndicators(prompt)) missingElements.push('quality_indicators');
  } else if (mediaType === 'text') {
    if (!hasTone(prompt)) missingElements.push('tone');
    if (!hasFormat(prompt)) missingElements.push('format');
    if (!hasContext(prompt)) missingElements.push('context');
  } else if (mediaType === 'video' || mediaType === 'audio') {
    if (!hasDuration(prompt)) missingElements.push('duration');
    if (!hasStyle(prompt)) missingElements.push('style');
    if (!hasTechnicalSpecs(prompt)) missingElements.push('technical_specs');
  }

  // Check grammar issues
  const grammarIssues = checkGrammar(prompt);
  const grammarFixed = grammarIssues.length > 0;

  // Check structure
  const structureIssues = checkStructure(prompt);
  const structureImproved = structureIssues.length > 0;

  // Calculate scores
  const completenessScore = calculateCompletenessScore(missingElements.length, mediaType);
  const clarityScore = calculateClarityScore(prompt, grammarIssues);
  const specificityScore = calculateSpecificityScore(prompt, wordCount);
  const structureScore = calculateStructureScore(prompt, structureIssues);

  return {
    completenessScore,
    missingElements,
    grammarFixed,
    structureImproved,
    wordCount,
    clarityScore,
    specificityScore,
    structureScore,
    issues: [...grammarIssues, ...structureIssues],
  };
}

/**
 * Check for grammar issues
 */
function checkGrammar(prompt: string): string[] {
  const issues: string[] = [];

  // Check for missing articles (a, an, the)
  if (/\b(cat|dog|image|picture|photo)\b/i.test(prompt) && !/\b(a|an|the)\s+(cat|dog|image|picture|photo)\b/i.test(prompt)) {
    issues.push('Missing article (a/an/the)');
  }

  // Check for common grammar mistakes
  if (/\b(draw|make|create)\s+me\s+/i.test(prompt)) {
    issues.push('Informal language - consider using "create" instead of "draw me"');
  }

  return issues;
}

/**
 * Check for structure issues
 */
function checkStructure(prompt: string): string[] {
  const issues: string[] = [];

  // Check if prompt is too short
  const wordCount = prompt.split(/\s+/).filter((word) => word.length > 0).length;
  if (wordCount < 3) {
    issues.push('Prompt is too short');
  }

  // Check if prompt lacks structure
  if (!/[.,;:]/.test(prompt) && wordCount > 5) {
    issues.push('Prompt lacks proper punctuation and structure');
  }

  return issues;
}

/**
 * Check if prompt has style information
 */
function hasStyle(prompt: string): boolean {
  const styleKeywords = [
    'photorealistic',
    'cartoon',
    'artistic',
    'abstract',
    'minimalist',
    'realistic',
    'illustration',
    'painting',
    'drawing',
    'sketch',
  ];
  return styleKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has composition information
 */
function hasComposition(prompt: string): boolean {
  const compositionKeywords = [
    'centered',
    'close-up',
    'full body',
    'portrait',
    'landscape',
    'rule of thirds',
    'framed',
  ];
  return compositionKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has background information
 */
function hasBackground(prompt: string): boolean {
  const backgroundKeywords = [
    'background',
    'setting',
    'indoor',
    'outdoor',
    'studio',
    'environment',
    'scene',
  ];
  return backgroundKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has quality indicators
 */
function hasQualityIndicators(prompt: string): boolean {
  const qualityKeywords = [
    'high quality',
    'high-resolution',
    'professional',
    'detailed',
    'sharp',
    'crisp',
    '8k',
    '4k',
  ];
  return qualityKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has tone information
 */
function hasTone(prompt: string): boolean {
  const toneKeywords = [
    'professional',
    'casual',
    'formal',
    'friendly',
    'serious',
    'humorous',
    'technical',
  ];
  return toneKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has format information
 */
function hasFormat(prompt: string): boolean {
  const formatKeywords = [
    'paragraph',
    'list',
    'bullet points',
    'structured',
    'outline',
    'essay',
    'article',
  ];
  return formatKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has context
 */
function hasContext(prompt: string): boolean {
  // If prompt has more than 10 words, it likely has some context
  const wordCount = prompt.split(/\s+/).filter((word) => word.length > 0).length;
  return wordCount > 10;
}

/**
 * Check if prompt has duration information
 */
function hasDuration(prompt: string): boolean {
  const durationKeywords = [
    'second',
    'minute',
    'hour',
    'duration',
    'length',
    'short',
    'long',
  ];
  return durationKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Check if prompt has technical specs
 */
function hasTechnicalSpecs(prompt: string): boolean {
  const techKeywords = [
    'fps',
    'resolution',
    'bitrate',
    'codec',
    'format',
    'quality',
    'hd',
    '4k',
    '8k',
  ];
  return techKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

/**
 * Calculate completeness score (0-100)
 */
function calculateCompletenessScore(missingCount: number, mediaType: string): number {
  const maxMissing = mediaType === 'image' ? 4 : mediaType === 'text' ? 3 : 3;
  const score = Math.max(0, 100 - (missingCount / maxMissing) * 100);
  return Math.round(score);
}

/**
 * Calculate clarity score (0-100)
 */
function calculateClarityScore(prompt: string, grammarIssues: string[]): number {
  let score = 100;
  
  // Deduct points for grammar issues
  score -= grammarIssues.length * 15;
  
  // Check for clarity indicators
  if (prompt.length < 10) score -= 20;
  if (!/[.,;:]/.test(prompt) && prompt.split(/\s+/).length > 5) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate specificity score (0-100)
 */
function calculateSpecificityScore(prompt: string, wordCount: number): number {
  // More words generally means more specific
  // But we also check for descriptive words
  const descriptiveWords = prompt.match(/\b(beautiful|detailed|specific|clear|precise|exact)\b/gi);
  const descriptiveBonus = descriptiveWords ? descriptiveWords.length * 5 : 0;
  
  const baseScore = Math.min(100, (wordCount / 20) * 100);
  return Math.min(100, baseScore + descriptiveBonus);
}

/**
 * Calculate structure score (0-100)
 */
function calculateStructureScore(prompt: string, structureIssues: string[]): number {
  let score = 100;
  
  // Deduct for structure issues
  score -= structureIssues.length * 20;
  
  // Bonus for good structure
  if (/[.,;:]/.test(prompt)) score += 10;
  if (prompt.split(/\s+/).length > 5) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

