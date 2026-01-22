import PromptOptimization from '../models/promptOptimization.model.js';
import AppError from '../utils/appError.util.js';
import {
  QuickOptimizeInput,
  AnalyzePromptInput,
  BuildPromptInput,
  OptimizationHistoryParams,
} from '../validation/promptOptimizer.schema.js';
import { analyzePrompt } from '../utils/promptAnalyzer.util.js';
import {
  generateQuestions,
  parseFreeFormInput,
  buildOptimizedPrompt,
  isGeminiAvailable,
} from '../utils/gemini.util.js';
import { validateIntentPreservation } from '../utils/intentPreservation.util.js';
import { calculateComprehensiveQualityScore } from '../utils/qualityScoring.util.js';
import Prompt from '../models/prompt.model.js';
import { CreatePromptInput } from '../validation/prompt.schema.js';
import { ApplyOptimizationInput, FeedbackInput } from '../validation/promptOptimizer.schema.js';
import {
  questionCache,
  optimizationCache,
  generateQuestionsCacheKey,
  generateAnalysisCacheKey,
} from '../utils/cache.util.js';
import logger from '../config/logger.config.js';

/**
 * Quick optimization - grammar and structure fixes only
 */
export const quickOptimize = async (
  userId: string,
  input: QuickOptimizeInput,
) => {
  const { originalPrompt, targetModel, mediaType } = input;

  // Analyze the prompt
  const analysis = analyzePrompt(originalPrompt as string, mediaType);

  // Apply quick fixes (grammar and structure only)
  let optimizedPrompt: string = originalPrompt as string;

  // Fix common grammar issues
  if (analysis.grammarFixed) {
    // Improve informal language first
    optimizedPrompt = optimizedPrompt.replace(
      /\b(draw|make)\s+me\s+/gi,
      'create ',
    );

    // Fix missing articles (be more careful - only fix obvious cases)
    // Only fix if we see "create image of cat" -> "create an image of a cat"
    optimizedPrompt = optimizedPrompt.replace(
      /\b(create|generate|make)\s+(image|picture|photo)\s+of\s+(cat|dog|bird|animal)\b/gi,
      (match: string, verb: string, img: string, animal: string) => {
        return `${verb} an ${img} of a ${animal}`;
      },
    );
  }

  // Basic structure improvement
  if (optimizedPrompt.length > 0 && !/[.!?]$/.test(optimizedPrompt.trim())) {
    optimizedPrompt = optimizedPrompt.trim() + '.';
  }

  // Capitalize first letter
  optimizedPrompt =
    optimizedPrompt.charAt(0).toUpperCase() + optimizedPrompt.slice(1);

  // Calculate quality scores
  const afterAnalysis = analyzePrompt(optimizedPrompt as string, mediaType);
  const qualityScore = {
    before: Math.round(
      (analysis.clarityScore +
        analysis.specificityScore +
        analysis.structureScore) /
        3,
    ),
    after: Math.round(
      (afterAnalysis.clarityScore +
        afterAnalysis.specificityScore +
        afterAnalysis.structureScore) /
        3,
    ),
    improvements: analysis.issues.map((issue) => `Fixed: ${issue}`),
    intentPreserved: true,
  };

  // Create optimization record
  const optimization = await PromptOptimization.create({
    user: userId,
    originalPrompt,
    optimizedPrompt,
    targetModel,
    mediaType,
    optimizationType: 'quick',
    optimizationMode: 'complete',
    status: 'completed',
    qualityScore,
    metadata: {
      wordCount: {
        before: analysis.wordCount,
        after: afterAnalysis.wordCount,
      },
      clarityScore: {
        before: analysis.clarityScore,
        after: afterAnalysis.clarityScore,
      },
      specificityScore: {
        before: analysis.specificityScore,
        after: afterAnalysis.specificityScore,
      },
      structureScore: {
        before: analysis.structureScore,
        after: afterAnalysis.structureScore,
      },
      completenessScore: analysis.completenessScore,
    },
    analysis: {
      completenessScore: analysis.completenessScore,
      missingElements: analysis.missingElements,
      grammarFixed: analysis.grammarFixed,
      structureImproved: analysis.structureImproved,
    },
  });

  return optimization;
};

/**
 * Analyze prompt and generate questions
 */
export const analyzePromptForQuestions = async (
  userId: string,
  input: AnalyzePromptInput,
) => {
  const { originalPrompt, targetModel, mediaType } = input;

  // Analyze the prompt
  const analysis = analyzePrompt(originalPrompt as string, mediaType);

  // Generate quick optimized version (fallback)
  let quickOptimized: string = originalPrompt as string;
  if (analysis.grammarFixed) {
    quickOptimized = quickOptimized.replace(
      /\b(draw|make)\s+me\s+/gi,
      'create ',
    );
    quickOptimized =
      quickOptimized.charAt(0).toUpperCase() + quickOptimized.slice(1);
    if (!/[.!?]$/.test(quickOptimized.trim())) {
      quickOptimized = quickOptimized.trim() + '.';
    }
  }

  // Check cache first
  const cacheKey = generateQuestionsCacheKey(originalPrompt as string, mediaType, targetModel as string);
  let questionsData = questionCache.get<any>(cacheKey);

  // Generate questions using Gemini (if available) or template
  if (!questionsData) {
    if (isGeminiAvailable()) {
      try {
        questionsData = await generateQuestions(originalPrompt as string, mediaType, targetModel as string);
        // Cache the questions
        questionCache.set(cacheKey, questionsData);
      } catch (error: any) {
        logger.error(error, 'Failed to generate questions with Gemini, using template');
        questionsData = getTemplateQuestions(mediaType);
      }
    } else {
      questionsData = getTemplateQuestions(mediaType);
    }
  }

  // Create optimization record in 'analyzing' state
  const optimization = await PromptOptimization.create({
    user: userId,
    originalPrompt,
    optimizedPrompt: quickOptimized, // Quick fallback
    targetModel,
    mediaType,
    optimizationType: 'premium',
    optimizationMode: 'analyze',
    status: 'questions_ready',
    questions: questionsData.questions.map((q: any) => ({
      ...q,
      answered: false,
    })),
    analysis: {
      completenessScore: analysis.completenessScore,
      missingElements: analysis.missingElements,
      grammarFixed: analysis.grammarFixed,
      structureImproved: analysis.structureImproved,
    },
  });

  return {
    optimization,
    questions: questionsData.questions,
    additionalDetailsField: questionsData.additionalDetailsField,
    quickOptimized,
  };
};

/**
 * Build premium prompt from user answers
 */
export const buildPremiumPrompt = async (
  userId: string,
  input: BuildPromptInput,
) => {
  const { originalPrompt, targetModel, mediaType, answers, additionalDetails } = input;

  // Find existing optimization or create new one
  let optimization = await PromptOptimization.findOne({
    user: userId,
    originalPrompt,
    targetModel,
    mediaType,
    optimizationType: 'premium',
    status: 'questions_ready',
  }).sort({ createdAt: -1 });

  if (!optimization) {
    throw new AppError('No optimization found. Please analyze the prompt first.', 404);
  }

  // Parse additional details if provided (with media type context)
  let parsedDetails: Record<string, any> = {};
  if (additionalDetails && typeof additionalDetails === 'string' && additionalDetails.trim()) {
    if (isGeminiAvailable()) {
      try {
        parsedDetails = await parseFreeFormInput(additionalDetails, mediaType);
      } catch (error: any) {
        logger.error(error, 'Failed to parse additional details');
        parsedDetails = { other: additionalDetails };
      }
    } else {
      parsedDetails = { other: additionalDetails };
    }
  }

  // Build optimized prompt using Gemini
  let optimizedPrompt: string;
  if (isGeminiAvailable()) {
    try {
      const userAnswers: Record<string, any> = answers || {};
      const additionalDetailsStr: string = (additionalDetails && typeof additionalDetails === 'string') ? additionalDetails : '';
      optimizedPrompt = await buildOptimizedPrompt(
        originalPrompt as string,
        userAnswers,
        additionalDetailsStr || undefined,
        targetModel as string,
      );
    } catch (error: any) {
      logger.error(error, 'Failed to build prompt with Gemini');
      throw new AppError('Failed to build optimized prompt. Please try again.', 500);
    }
  } else {
    throw new AppError('Gemini is not available. Please configure GOOGLE_AI_API_KEY.', 500);
  }

  // Validate intent preservation
  const userAnswers: Record<string, any> = answers || {};
  const additionalDetailsStr: string = (additionalDetails && typeof additionalDetails === 'string') ? additionalDetails : '';
  const intentValidation = validateIntentPreservation(
    originalPrompt as string,
    optimizedPrompt,
    userAnswers,
    additionalDetailsStr || undefined,
  );

  // Log intent preservation violations if any
  if (!intentValidation.preserved) {
    logger.warn(
      {
        violations: intentValidation.violations,
        addedDetails: intentValidation.addedDetails,
      },
      'Intent preservation violations detected',
    );
  }

  // Calculate comprehensive quality scores
  const comprehensiveScore = calculateComprehensiveQualityScore(
    originalPrompt as string,
    optimizedPrompt,
    mediaType,
    userAnswers,
    additionalDetailsStr || undefined,
  );

  const beforeAnalysis = analyzePrompt(originalPrompt as string, mediaType);
  const afterAnalysis = analyzePrompt(optimizedPrompt, mediaType);

  const qualityScore = {
    before: Math.round(
      (beforeAnalysis.clarityScore +
        beforeAnalysis.specificityScore +
        beforeAnalysis.structureScore) /
        3,
    ),
    after: comprehensiveScore.overall,
    improvements: [
      'Applied user preferences',
      'Enhanced structure and clarity',
      'Improved specificity',
      ...(intentValidation.preserved ? [] : ['Intent preservation warnings detected']),
    ],
    intentPreserved: intentValidation.preserved,
    intentPreservationScore: intentValidation.score,
    comprehensive: comprehensiveScore,
  };

  // Update optimization record
  optimization.optimizedPrompt = optimizedPrompt;
  optimization.optimizationMode = 'complete';
  optimization.status = 'completed';
  optimization.userAnswers = userAnswers;
  optimization.additionalDetails = additionalDetailsStr || undefined;
  optimization.qualityScore = qualityScore;
  optimization.metadata = {
    wordCount: {
      before: beforeAnalysis.wordCount,
      after: afterAnalysis.wordCount,
    },
    clarityScore: {
      before: beforeAnalysis.clarityScore,
      after: afterAnalysis.clarityScore,
    },
    specificityScore: {
      before: beforeAnalysis.specificityScore,
      after: afterAnalysis.specificityScore,
    },
    structureScore: {
      before: beforeAnalysis.structureScore,
      after: afterAnalysis.structureScore,
    },
    completenessScore: afterAnalysis.completenessScore,
  };

  // Update question answers
  if (answers && optimization.questions) {
    optimization.questions = optimization.questions.map((q) => {
      const answer = answers[q.id];
      if (answer) {
        return {
          ...q,
          answered: true,
          answer,
        };
      }
      return q;
    });
  }

  await optimization.save();

  return optimization;
};

/**
 * Get template questions (fallback when Gemini is not available)
 */
function getTemplateQuestions(mediaType: 'text' | 'image' | 'video' | 'audio'): any {
  if (mediaType === 'image') {
    return {
      questions: [
        {
          id: 'style',
          question: 'What style do you prefer?',
          type: 'select_or_text',
          priority: 'high',
          options: [
            { value: 'photorealistic', label: 'Photorealistic' },
            { value: 'cartoon', label: 'Cartoon/Illustration' },
            { value: 'artistic', label: 'Artistic/Painting' },
            { value: 'abstract', label: 'Abstract' },
            { value: 'minimalist', label: 'Minimalist' },
            { value: 'custom', label: 'Other (describe)', allowsTextInput: true },
            { value: 'no_preference', label: 'No preference' },
          ],
          default: 'photorealistic',
          required: false,
        },
        {
          id: 'composition',
          question: 'How should the subject be positioned?',
          type: 'select_or_text',
          priority: 'medium',
          options: [
            { value: 'centered', label: 'Centered' },
            { value: 'rule_of_thirds', label: 'Rule of thirds' },
            { value: 'close_up', label: 'Close-up' },
            { value: 'full_body', label: 'Full body' },
            { value: 'portrait', label: 'Portrait style' },
            { value: 'custom', label: 'Other (describe)', allowsTextInput: true },
            { value: 'no_preference', label: 'No preference' },
          ],
          default: 'centered',
          required: false,
        },
        {
          id: 'background',
          question: 'What background do you want?',
          type: 'select_or_text',
          priority: 'medium',
          options: [
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
            { value: 'studio', label: 'Studio/Plain' },
            { value: 'transparent', label: 'Transparent' },
            { value: 'natural', label: 'Natural environment' },
            { value: 'custom', label: 'Other (describe)', allowsTextInput: true },
            { value: 'no_preference', label: 'No preference' },
          ],
          default: 'natural',
          required: false,
        },
        {
          id: 'quality',
          question: 'What quality level?',
          type: 'select',
          priority: 'low',
          options: [
            { value: 'standard', label: 'Standard' },
            { value: 'high', label: 'High quality' },
            { value: 'professional', label: 'Professional/8K' },
            { value: 'no_preference', label: 'No preference' },
          ],
          default: 'high',
          required: false,
        },
      ],
      additionalDetailsField: {
        question: 'Any additional details you\'d like to include?',
        type: 'textarea',
        placeholder: 'E.g., colors, moods, specific details, references - Add anything else you want!',
        required: false,
      },
    };
  }

  // Default template for text prompts
  return {
    questions: [
      {
        id: 'tone',
        question: 'What tone do you prefer?',
        type: 'select_or_text',
        priority: 'high',
        options: [
          { value: 'professional', label: 'Professional' },
          { value: 'casual', label: 'Casual' },
          { value: 'formal', label: 'Formal' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'custom', label: 'Other (describe)', allowsTextInput: true },
          { value: 'no_preference', label: 'No preference' },
        ],
        default: 'professional',
        required: false,
      },
    ],
    additionalDetailsField: {
      question: 'Any additional details?',
      type: 'textarea',
      placeholder: 'Add any specific requirements or details',
      required: false,
    },
  };
}

/**
 * Get optimization history with enhanced filtering
 */
export const getOptimizationHistory = async (
  userId: string,
  query: OptimizationHistoryParams,
) => {
  const { page = 1, limit = 20, targetModel, optimizationType } = query;

  const filter: any = {
    user: userId,
    status: 'completed', // Only show completed optimizations
  };

  if (targetModel) {
    filter.targetModel = { $regex: targetModel, $options: 'i' };
  }

  if (optimizationType) {
    filter.optimizationType = optimizationType;
  }

  const skip = (page - 1) * limit;

  const optimizations = await PromptOptimization.find(filter)
    .select('-questions') // Don't return full questions array for list view
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean for better performance

  const total = await PromptOptimization.countDocuments(filter);

  // Calculate statistics
  const stats = await PromptOptimization.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        avgQualityImprovement: {
          $avg: {
            $subtract: [
              '$qualityScore.after',
              '$qualityScore.before',
            ],
          },
        },
        totalOptimizations: { $sum: 1 },
        quickCount: {
          $sum: { $cond: [{ $eq: ['$optimizationType', 'quick'] }, 1, 0] },
        },
        premiumCount: {
          $sum: { $cond: [{ $eq: ['$optimizationType', 'premium'] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    optimizations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
    stats: stats[0] || {
      avgQualityImprovement: 0,
      totalOptimizations: 0,
      quickCount: 0,
      premiumCount: 0,
    },
  };
};

/**
 * Get optimization by ID
 */
export const getOptimizationById = async (
  optimizationId: string,
  userId: string,
) => {
  const optimization = await PromptOptimization.findOne({
    _id: optimizationId,
    user: userId,
  });

  if (!optimization) {
    throw new AppError('Optimization not found.', 404);
  }

  return optimization;
};

/**
 * Delete optimization
 */
export const deleteOptimization = async (
  optimizationId: string,
  userId: string,
) => {
  const optimization = await PromptOptimization.findOne({
    _id: optimizationId,
    user: userId,
  });

  if (!optimization) {
    throw new AppError('Optimization not found.', 404);
  }

  await PromptOptimization.findByIdAndDelete(optimizationId);

  return { message: 'Optimization deleted successfully.' };
};

/**
 * Apply optimization to create a new Prompt
 */
export const applyOptimization = async (
  userId: string,
  optimizationId: string,
  input: Omit<ApplyOptimizationInput, 'optimizationId'>,
) => {
  const { title, description, tags, isPublic } = input;

  // Get the optimization
  const optimization = await PromptOptimization.findOne({
    _id: optimizationId,
    user: userId,
    status: 'completed',
  });

  if (!optimization) {
    throw new AppError('Optimization not found or not completed.', 404);
  }

  if (!optimization.optimizedPrompt) {
    throw new AppError('Optimized prompt not available.', 400);
  }

  // Create prompt from optimization
  const promptData: CreatePromptInput = {
    title,
    description,
    promptText: optimization.optimizedPrompt,
    sampleOutput: '', // User will need to add this later
    mediaType: optimization.mediaType,
    aiModel: optimization.targetModel,
    tags: tags || [],
    isPublic: isPublic ?? true,
  };

  const prompt = await Prompt.create({
    ...promptData,
    user: userId,
    originalPromptText: optimization.originalPrompt,
    isOptimized: true,
    optimizationId: optimization._id,
  });

  await prompt.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return prompt;
};

/**
 * Submit feedback on optimization
 */
export const submitFeedback = async (
  optimizationId: string,
  userId: string,
  input: FeedbackInput,
) => {
  const optimization = await PromptOptimization.findOne({
    _id: optimizationId,
    user: userId,
  });

  if (!optimization) {
    throw new AppError('Optimization not found.', 404);
  }

  // Add feedback to optimization (we'll store it in a feedback field)
  // For now, we'll add it to the document
  (optimization as any).feedback = {
    rating: input.rating,
    wasHelpful: input.wasHelpful,
    comments: input.comments,
    submittedAt: new Date(),
  };

  await optimization.save();

  return {
    message: 'Feedback submitted successfully.',
    feedback: {
      rating: input.rating,
      wasHelpful: input.wasHelpful,
      comments: input.comments,
    },
  };
};

