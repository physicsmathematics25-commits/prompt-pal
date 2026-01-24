import Prompt from '../models/prompt.model.js';
import Comment from '../models/comment.model.js';
import BlogPost from '../models/blog.model.js';
import ContentFlag from '../models/contentFlag.model.js';
import AppError from '../utils/appError.util.js';
import logger from '../config/logger.config.js';
import {
  ModerationReason,
  ContentType,
  FlagStatus,
  FlagResolution,
} from '../types/moderation.types.js';
import mongoose from 'mongoose';

// ============================================================================
// PROMPT MODERATION
// ============================================================================

export interface ModeratePromptInput {
  action: 'hide' | 'unhide' | 'delete' | 'restore';
  reason?: ModerationReason;
  notes?: string;
}

export const moderatePrompt = async (
  promptId: string,
  adminId: string,
  input: ModeratePromptInput,
) => {
  const prompt = await Prompt.findById(promptId);

  if (!prompt) {
    throw new AppError('Prompt not found.', 404);
  }

  const { action, reason, notes } = input;

  switch (action) {
    case 'hide':
      prompt.isHidden = true;
      if (reason) prompt.moderationReason = reason;
      if (notes) prompt.moderationNotes = notes;
      break;

    case 'unhide':
      prompt.isHidden = false;
      prompt.moderationReason = undefined;
      prompt.moderationNotes = undefined;
      break;

    case 'delete':
      if (prompt.isDeleted) {
        throw new AppError('Prompt is already deleted.', 400);
      }
      prompt.isDeleted = true;
      prompt.isHidden = true; // Also hide when deleting
      prompt.deletedAt = new Date();
      prompt.deletedBy = adminId as any;
      if (reason) prompt.moderationReason = reason;
      if (notes) prompt.moderationNotes = notes;
      break;

    case 'restore':
      if (!prompt.isDeleted) {
        throw new AppError('Prompt is not deleted.', 400);
      }
      prompt.isDeleted = false;
      prompt.isHidden = false;
      prompt.deletedAt = undefined;
      prompt.deletedBy = undefined;
      prompt.moderationReason = undefined;
      prompt.moderationNotes = undefined;
      break;

    default:
      throw new AppError('Invalid moderation action.', 400);
  }

  await prompt.save();

  logger.info(
    `[Moderation]: Admin ${adminId} performed ${action} on prompt ${promptId}`,
  );

  await prompt.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return prompt;
};

// ============================================================================
// COMMENT MODERATION
// ============================================================================

export interface ModerateCommentInput {
  action: 'hide' | 'unhide' | 'delete' | 'restore';
  reason?: ModerationReason;
  notes?: string;
}

export const moderateComment = async (
  commentId: string,
  adminId: string,
  input: ModerateCommentInput,
) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  const { action, reason, notes } = input;

  switch (action) {
    case 'hide':
      comment.isHidden = true;
      if (reason) comment.moderationReason = reason;
      if (notes) comment.moderationNotes = notes;
      break;

    case 'unhide':
      comment.isHidden = false;
      comment.moderationReason = undefined;
      comment.moderationNotes = undefined;
      break;

    case 'delete':
      if (comment.isDeleted) {
        throw new AppError('Comment is already deleted.', 400);
      }
      comment.isDeleted = true;
      comment.isHidden = true; // Also hide when deleting
      comment.deletedAt = new Date();
      comment.deletedBy = adminId as any;
      if (reason) comment.moderationReason = reason;
      if (notes) comment.moderationNotes = notes;
      break;

    case 'restore':
      if (!comment.isDeleted) {
        throw new AppError('Comment is not deleted.', 400);
      }
      comment.isDeleted = false;
      comment.isHidden = false;
      comment.deletedAt = undefined;
      comment.deletedBy = undefined;
      comment.moderationReason = undefined;
      comment.moderationNotes = undefined;
      break;

    default:
      throw new AppError('Invalid moderation action.', 400);
  }

  await comment.save();

  logger.info(
    `[Moderation]: Admin ${adminId} performed ${action} on comment ${commentId}`,
  );

  await comment.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  await comment.populate({
    path: 'prompt',
    select: 'title',
  });

  return comment;
};

// ============================================================================
// BULK MODERATION
// ============================================================================

export interface BulkModerateInput {
  contentType: ContentType;
  contentIds: string[];
  action: 'hide' | 'unhide' | 'delete' | 'restore';
  reason?: ModerationReason;
  notes?: string;
}

export const bulkModerate = async (
  adminId: string,
  input: BulkModerateInput,
) => {
  const { contentType, contentIds, action, reason, notes } = input;

  if (contentIds.length === 0) {
    throw new AppError('No content IDs provided.', 400);
  }

  if (contentIds.length > 100) {
    throw new AppError('Cannot moderate more than 100 items at once.', 400);
  }

  // Validate ObjectIds
  const validIds = contentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== contentIds.length) {
    throw new AppError('Invalid content ID format.', 400);
  }

  const Model = contentType === 'prompt' ? Prompt : Comment;
  const updateData: any = {};
  const unsetData: any = {};

  switch (action) {
    case 'hide':
      updateData.isHidden = true;
      if (reason) updateData.moderationReason = reason;
      if (notes) updateData.moderationNotes = notes;
      break;

    case 'unhide':
      updateData.isHidden = false;
      unsetData.moderationReason = '';
      unsetData.moderationNotes = '';
      break;

    case 'delete':
      updateData.isDeleted = true;
      updateData.isHidden = true;
      updateData.deletedAt = new Date();
      updateData.deletedBy = adminId;
      if (reason) updateData.moderationReason = reason;
      if (notes) updateData.moderationNotes = notes;
      break;

    case 'restore':
      updateData.isDeleted = false;
      updateData.isHidden = false;
      unsetData.deletedAt = '';
      unsetData.deletedBy = '';
      unsetData.moderationReason = '';
      unsetData.moderationNotes = '';
      break;

    default:
      throw new AppError('Invalid moderation action.', 400);
  }

  // Build the update object
  const update: any = {};
  if (Object.keys(updateData).length > 0) {
    update.$set = updateData;
  }
  if (Object.keys(unsetData).length > 0) {
    update.$unset = unsetData;
  }

  const result = await Model.updateMany(
    { _id: { $in: validIds } },
    update,
  );

  logger.info(
    `[Moderation]: Admin ${adminId} bulk ${action} ${result.modifiedCount} ${contentType}(s)`,
  );

  return {
    total: contentIds.length,
    modified: result.modifiedCount,
    matched: result.matchedCount,
  };
};

// ============================================================================
// FLAG CONTENT
// ============================================================================

export interface FlagContentInput {
  contentType: ContentType;
  contentId: string;
  reason: ModerationReason;
  description?: string;
}

export const flagContent = async (
  userId: string,
  input: FlagContentInput,
) => {
  const { contentType, contentId, reason, description } = input;

  // Validate content exists
  let content: any;
  if (contentType === 'prompt') {
    content = await Prompt.findById(contentId);
  } else if (contentType === 'comment') {
    content = await Comment.findById(contentId);
  } else if (contentType === 'blog') {
    content = await BlogPost.findById(contentId);
  } else {
    throw new AppError('Invalid content type.', 400);
  }

  if (!content) {
    throw new AppError(`${contentType} not found.`, 404);
  }

  // Check if user already flagged this content
  const existingFlag = await ContentFlag.findOne({
    contentType,
    contentId,
    reportedBy: userId,
    status: { $in: ['pending', 'reviewed'] },
  });

  if (existingFlag) {
    throw new AppError('You have already flagged this content.', 400);
  }

  // Create flag
  const flag = await ContentFlag.create({
    contentType,
    contentId,
    reportedBy: userId,
    reason,
    description,
    status: 'pending',
  });

  // Increment flagged count on content
  if (contentType === 'prompt') {
    await Prompt.findByIdAndUpdate(contentId, {
      $inc: { flaggedCount: 1 },
      $set: { lastFlaggedAt: new Date() },
    });
  } else if (contentType === 'comment') {
    await Comment.findByIdAndUpdate(contentId, {
      $inc: { flaggedCount: 1 },
      $set: { lastFlaggedAt: new Date() },
    });
  } else if (contentType === 'blog') {
    await BlogPost.findByIdAndUpdate(contentId, {
      $inc: { flaggedCount: 1 },
      $set: { lastFlaggedAt: new Date() },
    });
  }

  logger.info(
    `[Moderation]: User ${userId} flagged ${contentType} ${contentId}`,
  );

  await flag.populate({
    path: 'reportedBy',
    select: 'firstName lastName email',
  });

  return flag;
};

// ============================================================================
// REVIEW FLAG
// ============================================================================

export interface ReviewFlagInput {
  resolution: FlagResolution;
  notes?: string;
}

export const reviewFlag = async (
  flagId: string,
  adminId: string,
  input: ReviewFlagInput,
) => {
  const { resolution, notes } = input;

  const flag = await ContentFlag.findById(flagId);

  if (!flag) {
    throw new AppError('Flag not found.', 404);
  }

  if (flag.status !== 'pending') {
    throw new AppError('Flag has already been reviewed.', 400);
  }

  // Update flag
  flag.status = 'resolved';
  flag.reviewedBy = adminId as any;
  flag.reviewedAt = new Date();
  flag.resolution = resolution;
  if (notes) flag.resolutionNotes = notes;

  await flag.save();

  // Apply resolution action to content
  const content =
    flag.contentType === 'prompt'
      ? await Prompt.findById(flag.contentId)
      : await Comment.findById(flag.contentId);

  if (content) {
    switch (resolution) {
      case 'content_hidden':
        content.isHidden = true;
        content.moderationReason = flag.reason;
        if (notes) content.moderationNotes = notes;
        await content.save();
        break;

      case 'content_deleted':
        content.isDeleted = true;
        content.isHidden = true;
        content.deletedAt = new Date();
        content.deletedBy = adminId as any;
        content.moderationReason = flag.reason;
        if (notes) content.moderationNotes = notes;
        await content.save();
        break;

      case 'no_action':
      case 'false_report':
        // No action needed
        break;

      case 'user_warned':
        // Just log - user warning would be handled separately
        break;
    }
  }

  logger.info(
    `[Moderation]: Admin ${adminId} reviewed flag ${flagId} with resolution: ${resolution}`,
  );

  await flag.populate({
    path: 'reportedBy',
    select: 'firstName lastName email',
  });

  await flag.populate({
    path: 'reviewedBy',
    select: 'firstName lastName email',
  });

  return flag;
};

// ============================================================================
// DISMISS FLAG
// ============================================================================

export const dismissFlag = async (flagId: string, adminId: string) => {
  const flag = await ContentFlag.findById(flagId);

  if (!flag) {
    throw new AppError('Flag not found.', 404);
  }

  if (flag.status !== 'pending') {
    throw new AppError('Flag has already been reviewed.', 400);
  }

  flag.status = 'dismissed';
  flag.reviewedBy = adminId as any;
  flag.reviewedAt = new Date();
  flag.resolution = 'false_report';

  await flag.save();

  logger.info(`[Moderation]: Admin ${adminId} dismissed flag ${flagId}`);

  return flag;
};

// ============================================================================
// GET FLAGGED CONTENT
// ============================================================================

export interface GetFlaggedContentQuery {
  contentType?: ContentType;
  status?: FlagStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const getFlaggedContent = async (query: GetFlaggedContentQuery) => {
  const {
    contentType,
    status = 'pending',
    page = 1,
    limit = 20,
    startDate,
    endDate,
  } = query;

  const filter: any = {};

  if (contentType) filter.contentType = contentType;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const flags = await ContentFlag.find(filter)
    .populate({
      path: 'reportedBy',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'reviewedBy',
      select: 'firstName lastName email',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ContentFlag.countDocuments(filter);

  return {
    flags,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

// ============================================================================
// GET FLAG STATISTICS
// ============================================================================

export const getFlagStats = async () => {
  const stats = await ContentFlag.aggregate([
    {
      $group: {
        _id: null,
        totalFlags: { $sum: 1 },
        pendingFlags: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        resolvedFlags: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
        dismissedFlags: {
          $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] },
        },
        byReason: {
          $push: '$reason',
        },
        byContentType: {
          $push: '$contentType',
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalFlags: 0,
    pendingFlags: 0,
    resolvedFlags: 0,
    dismissedFlags: 0,
    byReason: [],
    byContentType: [],
  };

  // Count by reason
  const reasonCounts: Record<string, number> = {};
  result.byReason.forEach((reason: string) => {
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  // Count by content type
  const contentTypeCounts: Record<string, number> = {};
  result.byContentType.forEach((type: string) => {
    contentTypeCounts[type] = (contentTypeCounts[type] || 0) + 1;
  });

  return {
    total: result.totalFlags,
    pending: result.pendingFlags,
    resolved: result.resolvedFlags,
    dismissed: result.dismissedFlags,
    byReason: reasonCounts,
    byContentType: contentTypeCounts,
  };
};

