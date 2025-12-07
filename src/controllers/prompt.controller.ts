import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as promptService from '../services/prompt.service.js';
import {
  FeedQueryParams,
  GetPromptParams,
} from '../validation/prompt.schema.js';
import AppError from '../utils/appError.util.js';

export const createPrompt = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to create a prompt.', 401);
    }

    const { mediaType } = req.body;
    let imageUrl: string | undefined;

    if (mediaType === 'image') {
      if (!req.file) {
        throw new AppError('Image file is required for image media type.', 400);
      }
      imageUrl = req.file.path;
    } else {
      if (!req.body.sampleOutput) {
        throw new AppError(
          'Sample output is required for non-image media types.',
          400,
        );
      }
    }

    const prompt = await promptService.createPrompt(
      req.user.id,
      req.body,
      imageUrl,
    );

    res.status(201).json({
      status: 'success',
      data: {
        prompt,
      },
    });
  },
);

export const getFeed = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as FeedQueryParams;
    const data = await promptService.getFeed(query);

    res.status(200).json({
      status: 'success',
      data: {
        prompts: data.prompts,
        pagination: {
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
          limit: data.limit,
        },
      },
    });
  },
);

export const getPrompt = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetPromptParams;

    const prompt = await promptService.getPromptById(id);

    res.status(200).json({
      status: 'success',
      data: {
        prompt,
      },
    });
  },
);

export const updatePrompt = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to update a prompt.', 401);
    }

    const { id } = req.params as GetPromptParams;
    const prompt = await promptService.updatePrompt(
      id,
      req.user.id,
      req.body,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        prompt,
      },
    });
  },
);

export const deletePrompt = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to delete a prompt.', 401);
    }

    const { id } = req.params as GetPromptParams;
    const result = await promptService.deletePrompt(
      id,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  },
);

export const toggleLike = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to like a prompt.', 401);
    }

    const { id } = req.params as GetPromptParams;
    const prompt = await promptService.toggleLike(id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        prompt,
      },
    });
  },
);
