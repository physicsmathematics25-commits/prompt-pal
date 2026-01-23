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
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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

/**
 * Get media-specific prompt engineering guidance
 */
function getMediaSpecificPromptGuidance(
  mediaType: 'text' | 'image' | 'video' | 'audio',
  targetModel: string,
): string {
  if (mediaType === 'text') {
    return `TEXT PROMPT OPTIMIZATION GUIDANCE:
- Add role/context when appropriate (e.g., "Act as a [role]", "You are a [expert]")
- Specify output format (paragraph, list, structured, code, JSON, etc.)
- Include tone and style specifications (professional, casual, technical, creative)
- Add constraints and guidelines when relevant
- Include examples or few-shot patterns if the prompt benefits from them
- Specify length requirements if implied (short, detailed, comprehensive)
- Add chain-of-thought reasoning if the task requires step-by-step thinking`;
  } else if (mediaType === 'image') {
    return `IMAGE PROMPT OPTIMIZATION GUIDANCE:
- Include technical specifications (resolution, aspect ratio, quality)
- Add style modifiers and artistic direction
- Specify composition rules (rule of thirds, centered, etc.)
- Include lighting and mood specifications if relevant
- Add quality indicators (high-resolution, professional, detailed)
- Format for ${targetModel} best practices (comma-separated for DALL-E, style tags for Midjourney)`;
  } else if (mediaType === 'video' || mediaType === 'audio') {
    return `${mediaType.toUpperCase()} PROMPT OPTIMIZATION GUIDANCE:
- Specify duration and pacing
- Include technical specs (fps, resolution, bitrate, format)
- Add style and mood specifications
- Include composition and framing for video
- Add quality and format requirements`;
  }
  return '';
}

/**
 * Parse JSON response from AI with robust error handling
 * Handles malformed JSON, unescaped quotes, and other common issues
 */
function parseJSONResponse(response: string): any {
  // Step 1: Remove markdown code blocks
  let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Step 2: Extract JSON object (handle text before/after)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Step 3: Try direct parsing first
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Step 4: Try to repair common JSON issues
    try {
      // Fix unescaped quotes in string values using a more robust approach
      let fixed = cleaned;
      
      // Find all string values and fix unescaped quotes
      // This regex matches: "key": "value" where value may contain unescaped quotes
      fixed = fixed.replace(/"([^"]+)":\s*"([^"]*)"([,}\]]|$)/g, (match, key, value, ending) => {
        // If value contains unescaped quotes, escape them
        if (value.includes('"') && !value.includes('\\"')) {
          const escapedValue = value.replace(/"/g, '\\"');
          return `"${key}": "${escapedValue}"${ending}`;
        }
        return match;
      });
      
      // Try parsing the fixed version
      return JSON.parse(fixed);
    } catch (secondError) {
      // Step 5: Manual extraction as last resort
      try {
        const result: any = {};
        
        // Extract optimizedPrompt - handle escaped and unescaped quotes
        const optimizedPromptRegex = /"optimizedPrompt"\s*:\s*"((?:[^"\\]|\\.)*)"/;
        const optimizedMatch = cleaned.match(optimizedPromptRegex);
        if (optimizedMatch) {
          result.optimizedPrompt = optimizedMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
        } else {
          // Fallback: try to find it even with unescaped quotes
          const fallbackMatch = cleaned.match(/"optimizedPrompt"\s*:\s*"([^"]*(?:"[^,}\]]*)*)"/);
          if (fallbackMatch) {
            result.optimizedPrompt = fallbackMatch[1].replace(/"/g, '');
          } else {
            throw new Error('Could not extract optimizedPrompt');
          }
        }
        
        // Extract isValid
        const isValidMatch = cleaned.match(/"isValid"\s*:\s*(true|false)/);
        result.isValid = isValidMatch ? isValidMatch[1] === 'true' : true;
        
        // Extract validationMessage
        const validationRegex = /"validationMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/;
        const validationMatch = cleaned.match(validationRegex);
        if (validationMatch) {
          result.validationMessage = validationMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
        }
        
        // Extract improvements array
        const improvementsRegex = /"improvements"\s*:\s*\[(.*?)\]/s;
        const improvementsMatch = cleaned.match(improvementsRegex);
        if (improvementsMatch) {
          try {
            // Try to parse as JSON array
            const arrayStr = '[' + improvementsMatch[1] + ']';
            result.improvements = JSON.parse(arrayStr);
          } catch {
            // Fallback: extract strings manually
            const stringMatches = improvementsMatch[1].match(/"([^"]+)"/g);
            result.improvements = stringMatches 
              ? stringMatches.map((m: string) => m.replace(/^"|"$/g, '').replace(/\\"/g, '"'))
              : [];
          }
        } else {
          result.improvements = [];
        }
        
        // Extract qualityScore
        const qualityScoreMatch = cleaned.match(/"qualityScore"\s*:\s*(\d+)/);
        result.qualityScore = qualityScoreMatch ? parseInt(qualityScoreMatch[1], 10) : 70;
        
        // Validate we have at least optimizedPrompt
        if (!result.optimizedPrompt) {
          throw new Error('Could not extract required fields');
        }
        
        return result;
      } catch (thirdError) {
        logger.error(
          {
            firstError: firstError instanceof Error ? firstError.message : String(firstError),
            secondError: secondError instanceof Error ? secondError.message : String(secondError),
            thirdError: thirdError instanceof Error ? thirdError.message : String(thirdError),
            responsePreview: response.substring(0, 500), // Log first 500 chars
          },
          'Failed to parse JSON response after all attempts',
        );
        throw new Error('Failed to parse AI response as valid JSON');
      }
    }
  }
}

/**
 * Get advanced prompt engineering techniques guidance based on media type
 */
function getAdvancedTechniquesGuidance(mediaType: 'text' | 'image' | 'video' | 'audio'): string {
  if (mediaType === 'text') {
    return `For TEXT prompts, apply these techniques when appropriate:
1. ROLE-PLAYING: Add "Act as a [role]" or "You are a [expert]" when the prompt implies a specific role
   - Example: "explain quantum physics" → "Act as a physics professor. Explain quantum physics..."
   - Example: "write code" → "Act as a senior software engineer. Write code..."
   - Only add if role is naturally implied by the task

2. CONTEXT SETTING: Add relevant context, background, or constraints
   - Example: "write a blog post" → "Write a blog post for a tech-savvy audience..."
   - Only add context that enhances clarity without changing intent

3. OUTPUT FORMAT: Specify desired output format (paragraph, list, JSON, code, table, etc.)
   - Example: "list benefits" → "List the benefits in bullet points..."
   - Only add if format is implied or would significantly improve results

4. TONE & STYLE: Specify tone (professional, casual, technical, creative, formal)
   - Example: "write email" → "Write a professional email..."
   - Only add if tone is implied by context

5. CONSTRAINTS: Add relevant constraints or guidelines
   - Example: "generate ideas" → "Generate 5 creative ideas, each in one sentence..."
   - Only add if constraints would improve specificity

6. EXAMPLES: Add few-shot examples if the task benefits from demonstration
   - Only add if the prompt type naturally benefits from examples (classification, formatting, etc.)

7. CHAIN OF THOUGHT: Add step-by-step reasoning for complex tasks
   - Example: "solve math problem" → "Solve this math problem step by step, showing your reasoning..."
   - Only add for analytical or problem-solving tasks`;
  } else if (mediaType === 'image') {
    return `For IMAGE prompts, apply these techniques when appropriate:
1. TECHNICAL SPECIFICATIONS: Add resolution, aspect ratio, quality indicators
   - Example: "create image" → "Create a high-resolution 16:9 image..."
   - Only add if it improves the prompt without changing creative intent

2. STYLE MODIFIERS: Add appropriate style tags for the target model
   - Example: For Midjourney: add style tags like "--style raw --ar 16:9"
   - Example: For DALL-E: use comma-separated descriptive style terms

3. COMPOSITION RULES: Add framing and composition guidance
   - Example: "portrait" → "Portrait composition, rule of thirds..."
   - Only add if it enhances the prompt naturally

4. QUALITY INDICATORS: Add professional quality markers
   - Example: "high quality", "professional", "detailed", "sharp focus"
   - Only add if it improves the prompt without being redundant`;
  } else {
    return `For ${mediaType.toUpperCase()} prompts, apply these techniques when appropriate:
1. TECHNICAL SPECIFICATIONS: Add fps, resolution, bitrate, format, duration
2. STYLE & PACING: Add style modifiers and pacing specifications
3. QUALITY INDICATORS: Add professional quality markers
4. COMPOSITION: For video, add framing and composition guidance`;
  }
}

/**
 * Quick optimize prompt using AI following standard prompt engineering best practices
 * Returns optimized prompt with validation and improvements list
 */
export interface QuickOptimizeResult {
  optimizedPrompt: string;
  isValid: boolean;
  validationMessage?: string;
  improvements: string[];
  qualityScore: number;
}

export async function quickOptimizeWithAI(
  originalPrompt: string,
  targetModel: string,
  mediaType: 'text' | 'image' | 'video' | 'audio',
): Promise<QuickOptimizeResult> {
  const modelGuidance = getModelSpecificGuidance(targetModel, mediaType);

  // Get media-specific prompt engineering guidance
  const mediaSpecificGuidance = getMediaSpecificPromptGuidance(mediaType, targetModel);

  const systemPrompt = `You are a prompt optimization expert. Optimize this prompt following advanced prompt engineering best practices.

ORIGINAL PROMPT: "${originalPrompt}"
TARGET MODEL: ${targetModel}
MEDIA TYPE: ${mediaType}

${modelGuidance}

${mediaSpecificGuidance}

OPTIMIZATION RULES (CRITICAL - Apply ALL of these):
1. Fix ALL grammar and spelling errors
2. Remove unnecessary filler words ("very", "really", "quite", "actually", "just", "kind of", "sort of")
3. Remove redundancy and repetitive phrases
4. Improve clarity - replace vague terms with specific ones (e.g., "nice" → "professional", "good" → "high-quality")
5. Ensure proper structure: Subject → Action → Object → Context
6. Use action-oriented, strong verbs (create, generate, design, build)
7. Format appropriately for ${targetModel} best practices
8. Maintain appropriate length (not too short, not too long - typically 10-150 words for most prompts)
9. Ensure proper punctuation and capitalization
10. Remove any nonsensical or contradictory elements
11. Improve sentence flow and readability
12. Use concise, direct language

ADVANCED PROMPT ENGINEERING TECHNIQUES (Apply when appropriate):
${getAdvancedTechniquesGuidance(mediaType)}

INTENT PRESERVATION (CRITICAL - DO NOT VIOLATE):
- DO NOT add creative details (colors, backgrounds, styles, moods) not in the original prompt
- DO NOT add new subjects, objects, or concepts not mentioned
- DO NOT change the core meaning or intent
- ONLY improve grammar, structure, clarity, formatting, and apply appropriate prompt engineering techniques
- Preserve the user's original simplicity level - if they wanted simple, keep it simple
- If the original is vague, improve clarity WITH appropriate prompt engineering techniques (role, context, format) WITHOUT adding unsolicited creative details
- When adding role/context, infer it naturally from the prompt's intent (e.g., "write code" → add developer role, "explain physics" → add teacher role)

VALIDATION:
- If the prompt is completely nonsensical (random characters, gibberish, no coherent meaning), set isValid to false and explain why
- If the prompt is too vague to be useful (single word, extremely generic), set isValid to true but add a validationMessage warning
- If the prompt contains contradictions, resolve them by keeping the most logical interpretation
- If the prompt is inappropriate (harmful, illegal, unethical), set isValid to false and explain why

QUALITY SCORING:
- Rate the optimized prompt quality from 0-100
- Consider: clarity, specificity, structure, grammar, and adherence to prompt engineering best practices
- Higher scores for well-structured, clear, specific prompts
- Lower scores for vague, poorly structured prompts

Return your response as valid JSON in this exact format:
{
  "optimizedPrompt": "the optimized prompt text here",
  "isValid": true or false,
  "validationMessage": "optional message if prompt has issues or warnings",
  "improvements": ["Fixed grammar errors", "Removed filler words", "Improved clarity", ...],
  "qualityScore": 85
}

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON, no other text before or after
- ALL quotes inside string values MUST be escaped with backslash: \\"
- ALL newlines inside string values MUST be escaped: \\n
- ALL backslashes MUST be escaped: \\\\
- The JSON must be valid and parseable
- Do NOT include any explanatory text outside the JSON

IMPORTANT:
- The optimizedPrompt must be the final, ready-to-use prompt
- List specific improvements made (e.g., "Fixed grammar: added missing articles", "Removed redundancy: 'very very' → removed")
- If isValid is false, validationMessage is required
- qualityScore must be a number between 0-100`;

  try {
    const response = await generateContent(systemPrompt);
    
    // Parse JSON with robust error handling
    const parsed = parseJSONResponse(response) as QuickOptimizeResult;
    
    // Validate the response structure
    if (!parsed.optimizedPrompt || typeof parsed.optimizedPrompt !== 'string') {
      throw new Error('Invalid response: missing optimizedPrompt');
    }
    
    if (typeof parsed.isValid !== 'boolean') {
      parsed.isValid = true; // Default to valid if not specified
    }
    
    if (!Array.isArray(parsed.improvements)) {
      parsed.improvements = [];
    }
    
    if (typeof parsed.qualityScore !== 'number') {
      parsed.qualityScore = 70; // Default score
    }
    
    // Ensure qualityScore is within bounds
    parsed.qualityScore = Math.max(0, Math.min(100, parsed.qualityScore));
    
    return parsed;
  } catch (error: any) {
    logger.error(error, 'Failed to quick optimize with AI');
    throw new Error(`AI optimization failed: ${error.message || 'Unknown error'}`);
  }
}

// Initialize on module load
initializeGemini();

