import Prompt from '../models/prompt.model.js';
import AppError from '../utils/appError.util.js';
import { CreatePromptInput, UpdatePromptInput, FeedQueryParams } from '../validation/prompt.schema.js';
import { cloudinary } from '../utils/cloudinary.util.js';
import logger from '../config/logger.config.js';

export const createPrompt = async (
  userId: string,
  input: CreatePromptInput,
  imageUrl?: string,
) => {
  const promptData: any = {
    ...input,
    user: userId,
    sampleOutput: imageUrl || input.sampleOutput,
  };

  if (imageUrl) {
    promptData.mediaType = 'image';
    promptData.sampleOutput = imageUrl;
  }

  const prompt = await Prompt.create(promptData);
  
  await prompt.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return prompt;
};

export const getFeed = async (query: FeedQueryParams) => {
  const { page = 1, limit = 20, tag, aiModel, search } = query;

  const filter: any = {
    isPublic: true,
  };

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  if (aiModel) {
    filter.aiModel = { $regex: aiModel, $options: 'i' };
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  let queryBuilder = Prompt.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (search) {
    queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
  }

  const prompts = await queryBuilder;

  const total = await Prompt.countDocuments(filter);

  return {
    prompts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getPromptById = async (promptId: string, includeComments = false) => {
  const prompt = await Prompt.findById(promptId).populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  if (!prompt) {
    throw new AppError('Prompt not found.', 404);
  }

  prompt.views += 1;
  await prompt.save();

  // Optionally include comments count (not full comments to avoid heavy payload)
  if (includeComments) {
    const Comment = (await import('../models/comment.model.js')).default;
    const commentCount = await Comment.countDocuments({ prompt: promptId });
    (prompt as any).commentCount = commentCount;
  }

  return prompt;
};

export const updatePrompt = async (
  promptId: string,
  userId: string,
  input: UpdatePromptInput,
  userRole: string,
) => {
  const prompt = await Prompt.findById(promptId);

  if (!prompt) {
    throw new AppError('Prompt not found.', 404);
  }

  const isOwner = prompt.user.toString() === userId.toString();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isOwner && !isAdmin) {
    throw new AppError(
      'You do not have permission to update this prompt.',
      403,
    );
  }

  Object.keys(input).forEach((key) => {
    if (input[key as keyof UpdatePromptInput] !== undefined) {
      (prompt as any)[key] = input[key as keyof UpdatePromptInput];
    }
  });

  await prompt.save();

  await prompt.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return prompt;
};

export const deletePrompt = async (
  promptId: string,
  userId: string,
  userRole: string,
) => {
  const prompt = await Prompt.findById(promptId);

  if (!prompt) {
    throw new AppError('Prompt not found.', 404);
  }

  const isOwner = prompt.user.toString() === userId.toString();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isOwner && !isAdmin) {
    throw new AppError(
      'You do not have permission to delete this prompt.',
      403,
    );
  }

  if (prompt.mediaType === 'image' && prompt.sampleOutput) {
    try {
      const url = prompt.sampleOutput;
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
      
      if (match && match[1]) {
        const publicIdWithFolder = match[1].replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        
        if (publicIdWithFolder) {
          await cloudinary.api.delete_resources([publicIdWithFolder]);
          logger.info(`[Cloudinary]: Deleted image ${publicIdWithFolder} for prompt ${promptId}`);
        }
      }
    } catch (error: any) {
      logger.error(
        error,
        `[Cloudinary]: Failed to delete image for prompt ${promptId}`,
      );
    }
  }

  await Prompt.findByIdAndDelete(promptId);

  return { message: 'Prompt deleted successfully.' };
};

export const toggleLike = async (promptId: string, userId: string) => {
  const prompt = await Prompt.findById(promptId);

  if (!prompt) {
    throw new AppError('Prompt not found.', 404);
  }

  const likeIndex = prompt.likes.findIndex(
    (id) => id.toString() === userId.toString(),
  );

  if (likeIndex > -1) {
    prompt.likes.splice(likeIndex, 1);
  } else {
    prompt.likes.push(userId as any);
  }

  await prompt.save();

  await prompt.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return prompt;
};

export const getUserPrompts = async (
  userId: string,
  query: FeedQueryParams,
) => {
  const { page = 1, limit = 20, tag, aiModel, search } = query;

  const filter: any = {
    user: userId,
  };

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  if (aiModel) {
    filter.aiModel = { $regex: aiModel, $options: 'i' };
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  let queryBuilder = Prompt.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (search) {
    queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
  }

  const prompts = await queryBuilder;

  const total = await Prompt.countDocuments(filter);

  return {
    prompts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

export const getUserFavorites = async (
  userId: string,
  query: FeedQueryParams,
) => {
  const { page = 1, limit = 20, tag, aiModel, search } = query;

  const filter: any = {
    likes: userId,
  };

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  if (aiModel) {
    filter.aiModel = { $regex: aiModel, $options: 'i' };
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  let queryBuilder = Prompt.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (search) {
    queryBuilder = queryBuilder.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
  }

  const prompts = await queryBuilder;

  const total = await Prompt.countDocuments(filter);

  return {
    prompts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

