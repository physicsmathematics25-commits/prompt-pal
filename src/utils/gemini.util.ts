/**
 * Google Gemini AI Integration Utility
 * Handles all interactions with Google Gemini API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

/**
 * Initialize Gemini client
 */
export function initializeGemini() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    logger.warn('GOOGLE_AI_API_KEY not set. Gemini features will be disabled.');
    return;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const temperature = parseFloat(process.env.OPTIMIZATION_TEMPERATURE || '0.7');
    const maxTokens = parseInt(process.env.OPTIMIZATION_MAX_TOKENS || '2000', 10);

    model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    logger.info(`Gemini initialized with model: ${modelName}`);
  } catch (error) {
    logger.error(error, 'Failed to initialize Gemini');
  }
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return model !== null;
}

/**
 * Generate content using Gemini with retry logic
 */
export async function generateContent(
  prompt: string,
  maxRetries: number = 3,
): Promise<string> {
  if (!model) {
    throw new Error('Gemini is not initialized. Please set GOOGLE_AI_API_KEY.');
  }

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      lastError = error;
      logger.error(error, `Gemini API error (attempt ${attempt}/${maxRetries})`);
      
      // Don't retry on rate limits or authentication errors
      if (
        error.message?.includes('429') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('401') ||
        error.message?.includes('403')
      ) {
        throw new Error(
          error.message?.includes('429') || error.message?.includes('rate limit')
            ? 'Rate limit exceeded. Please try again later.'
            : 'Authentication failed. Please check your API key.',
        );
      }
      
      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw new Error(
    `Gemini API error after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
  );
}

/**
 * Generate questions for prompt optimization with model-specific support
 */
export async function generateQuestions(
  prompt: string,
  mediaType: 'text' | 'image' | 'video' | 'audio',
  targetModel: string,
): Promise<any> {
  // Get model-specific guidance
  const modelGuidance = getModelSpecificGuidance(targetModel, mediaType);

  const systemPrompt = `You are a prompt optimization expert. Analyze this prompt and generate 3-5 essential questions to help create a premium optimized prompt.

Original prompt: "${prompt}"
Media type: ${mediaType}
Target model: ${targetModel}

${modelGuidance}

Based on prompt engineering best practices for ${targetModel}, identify what's missing that would significantly improve this prompt.

Generate 3-5 essential questions. Each question should:
1. Address a critical missing element
2. Have clear, simple options
3. Include a sensible default
4. Be optional (user can skip)
5. Include an "Other" option with text input capability for flexibility

Return your response as valid JSON in this exact format:
{
  "questions": [
    {
      "id": "style",
      "question": "What style do you prefer?",
      "type": "select_or_text",
      "priority": "high",
      "options": [
        {"value": "photorealistic", "label": "Photorealistic"},
        {"value": "cartoon", "label": "Cartoon/Illustration"},
        {"value": "custom", "label": "Other (describe)", "allowsTextInput": true},
        {"value": "no_preference", "label": "No preference"}
      ],
      "default": "photorealistic",
      "required": false
    }
  ],
  "additionalDetailsField": {
    "question": "Any additional details you'd like to include?",
    "type": "textarea",
    "placeholder": "E.g., colors, moods, specific details, references - Add anything else you want!",
    "required": false
  }
}

Only return the JSON, no other text.`;

  const response = await generateContent(systemPrompt);
  
  // Try to parse JSON from response
  try {
    // Remove markdown code blocks if present
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    logger.error(parseError, 'Failed to parse Gemini response as JSON');
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

/**
 * Parse free-form user input to extract structured information with enhanced AI parsing
 */
export async function parseFreeFormInput(
  freeText: string,
  mediaType?: 'text' | 'image' | 'video' | 'audio',
): Promise<any> {
  const mediaContext = mediaType
    ? `Media type: ${mediaType}. Focus on ${mediaType}-specific details.`
    : '';

  const prompt = `You are an expert at parsing user input for prompt optimization. Extract structured information from this user input: "${freeText}"

${mediaContext}

Extract and categorize:
- Style/artistic direction (photorealistic, cartoon, artistic, etc.)
- Colors/color palette (specific colors, warm/cool tones, etc.)
- Lighting conditions (natural, studio, golden hour, etc.)
- Mood/atmosphere (cozy, dramatic, peaceful, etc.)
- Specific details (breed, pose, accessories, etc.)
- Setting/background (indoor, outdoor, specific locations, etc.)
- Composition elements (centered, rule of thirds, close-up, etc.)
- Quality indicators (high-resolution, professional, etc.)
- Any other relevant characteristics

IMPORTANT: Only extract what is explicitly mentioned. Do not infer or add details.

Return as valid JSON with these categories. If something doesn't fit a category, include it in "other".

Format:
{
  "style": "...",
  "colors": "...",
  "lighting": "...",
  "mood": "...",
  "details": "...",
  "background": "...",
  "composition": "...",
  "quality": "...",
  "other": "..."
}

Only return the JSON, no other text.`;

  const response = await generateContent(prompt);
  
  try {
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate and clean the parsed data
    return validateParsedInput(parsed, freeText);
  } catch (parseError) {
    logger.error(parseError, 'Failed to parse free-form input');
    // Return a basic structure if parsing fails
    return {
      other: freeText,
    };
  }
}

/**
 * Validate and clean parsed input
 */
function validateParsedInput(parsed: any, originalText: string): any {
  const validated: any = {
    style: parsed.style || '',
    colors: parsed.colors || '',
    lighting: parsed.lighting || '',
    mood: parsed.mood || '',
    details: parsed.details || '',
    background: parsed.background || '',
    composition: parsed.composition || '',
    quality: parsed.quality || '',
    other: parsed.other || '',
  };

  // Remove empty strings and keep only meaningful data
  Object.keys(validated).forEach((key) => {
    if (!validated[key] || validated[key].trim() === '') {
      delete validated[key];
    }
  });

  // If nothing was extracted, put everything in "other"
  if (Object.keys(validated).length === 0) {
    validated.other = originalText;
  }

  return validated;
}

/**
 * Build optimized prompt from user answers with intent preservation
 */
export async function buildOptimizedPrompt(
  originalPrompt: string,
  answers: Record<string, any>,
  additionalDetails: string | undefined,
  targetModel: string,
): Promise<string> {
  // Extract what user actually specified to reinforce intent preservation
  const userSpecified = extractUserSpecifiedInfo(originalPrompt, answers, additionalDetails);

  const prompt = `You are a prompt optimization expert. Build an optimized prompt from the following information.

Original prompt: "${originalPrompt}"
User Answers: ${JSON.stringify(answers)}
Additional Details: "${additionalDetails || 'None'}"
Target Model: ${targetModel}

USER SPECIFIED DETAILS (ONLY USE THESE):
${userSpecified}

CRITICAL RULES - INTENT PRESERVATION:
1. ONLY use information the user provided (original prompt + answers + additional details)
2. DO NOT add creative details (colors, backgrounds, styles, moods) NOT in the "USER SPECIFIED DETAILS" above
3. DO NOT assume preferences - if user didn't specify a color, don't add one
4. DO NOT add backgrounds, settings, or environments not mentioned by the user
5. DO NOT add moods, emotions, or atmospheres not specified
6. Maintain the user's original intent and simplicity level - if they wanted simple, keep it simple
7. Structure the prompt for ${targetModel} best practices
8. Combine all user inputs intelligently
9. Fix any grammar issues
10. Improve structure and clarity WITHOUT adding unsolicited details

VALIDATION CHECKLIST:
- Every color mentioned must be in USER SPECIFIED DETAILS
- Every style mentioned must be in USER SPECIFIED DETAILS  
- Every background mentioned must be in USER SPECIFIED DETAILS
- Every mood mentioned must be in USER SPECIFIED DETAILS

Return ONLY the optimized prompt text, nothing else. No explanations, no JSON, just the prompt.`;

  const response = await generateContent(prompt);
  return response.trim();
}

/**
 * Extract user-specified information to reinforce intent preservation
 */
function extractUserSpecifiedInfo(
  originalPrompt: string,
  answers: Record<string, any>,
  additionalDetails?: string,
): string {
  const parts: string[] = [];
  
  parts.push(`Original prompt: "${originalPrompt}"`);
  
  if (answers && Object.keys(answers).length > 0) {
    const answerList = Object.entries(answers)
      .map(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          const val = value.customText || value.value || '';
          if (val && val !== 'no_preference' && val !== 'default' && val !== 'skipped') {
            return `${key}: ${val}`;
          }
        }
        return null;
      })
      .filter(Boolean)
      .join(', ');
    
    if (answerList) {
      parts.push(`User answers: ${answerList}`);
    }
  }
  
  if (additionalDetails && additionalDetails.trim()) {
    parts.push(`Additional details: "${additionalDetails.trim()}"`);
  }
  
  return parts.join('\n') || 'No additional user specifications beyond original prompt.';
}

/**
 * Get model-specific guidance for question generation
 */
function getModelSpecificGuidance(
  targetModel: string,
  mediaType: string,
): string {
  const modelLower = targetModel.toLowerCase();

  // Image generation models
  if (mediaType === 'image') {
    if (modelLower.includes('dall-e') || modelLower.includes('dalle')) {
      return `DALL-E specific guidance:
- Focus on clear, descriptive language
- DALL-E works best with comma-separated descriptors
- Include style, composition, and quality indicators
- Consider aspect ratio and detail level`;
    } else if (modelLower.includes('midjourney')) {
      return `Midjourney specific guidance:
- Focus on artistic style and composition
- Consider aspect ratios and quality parameters
- Include style modifiers and artistic references
- Think about lighting and mood`;
    } else if (modelLower.includes('stable diffusion')) {
      return `Stable Diffusion specific guidance:
- Include quality tags and style modifiers
- Consider negative prompts (what to avoid)
- Focus on technical parameters and style
- Include composition and framing details`;
    }
  }

  // Text generation models
  if (mediaType === 'text') {
    if (modelLower.includes('gpt') || modelLower.includes('chatgpt')) {
      return `GPT specific guidance:
- Focus on role, context, and output format
- Include examples when helpful
- Specify tone and style preferences
- Consider token limits and response length`;
    } else if (modelLower.includes('claude')) {
      return `Claude specific guidance:
- Emphasize clarity and structure
- Include context and constraints
- Specify output format and style
- Consider conversation context if applicable`;
    }
  }

  // Default guidance
  return `General guidance:
- Focus on clarity, specificity, and structure
- Include relevant context and constraints
- Consider output format and quality requirements`;
}

// Initialize on module load
initializeGemini();

