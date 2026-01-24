import Comment from '../models/comment.model.js';
import Prompt from '../models/prompt.model.js';
import BlogPost from '../models/blog.model.js';
import AppError from '../utils/appError.util.js';
import {
  CreateCommentInput,
  UpdateCommentInput,
  GetCommentsQuery,
} from '../validation/comment.schema.js';
import { ContentType } from '../types/comment.types.js';

/**
 * Create a comment on any content (prompt or blog)
 */
export const createComment = async (
  contentId: string,
  contentType: ContentType,
  userId: string,
  input: CreateCommentInput,
) => {
  // Verify content exists
  if (contentType === 'prompt') {
    const prompt = await Prompt.findById(contentId);
    if (!prompt || prompt.isDeleted) {
      throw new AppError('Prompt not found.', 404);
    }
  } else if (contentType === 'blog') {
    const blog = await BlogPost.findById(contentId);
    if (!blog || blog.isDeleted) {
      throw new AppError('Blog post not found.', 404);
    }
  }

  const comment = await Comment.create({
    contentType,
    contentId,
    // Maintain backward compatibility
    prompt: contentType === 'prompt' ? contentId : undefined,
    user: userId,
    text: input.text,
  });

  await comment.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return comment;
};

/**
 * Get comments by content (prompt or blog)
 */
export const getCommentsByContent = async (
  contentId: string,
  contentType: ContentType,
  query: GetCommentsQuery,
) => {
  // Verify content exists
  if (contentType === 'prompt') {
    const prompt = await Prompt.findById(contentId);
    if (!prompt) {
      throw new AppError('Prompt not found.', 404);
    }
  } else if (contentType === 'blog') {
    const blog = await BlogPost.findById(contentId);
    if (!blog) {
      throw new AppError('Blog post not found.', 404);
    }
  }

  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({
    contentType,
    contentId,
    isDeleted: false,
    isHidden: false,
  })
    .populate({
      path: 'user',
      select: 'firstName lastName email profileImage',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Comment.countDocuments({
    contentType,
    contentId,
    isDeleted: false,
    isHidden: false,
  });

  return {
    comments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

// Backward compatibility wrapper
export const getCommentsByPrompt = async (
  promptId: string,
  query: GetCommentsQuery,
) => {
  return getCommentsByContent(promptId, 'prompt', query);
};

export const getCommentById = async (commentId: string) => {
  const comment = await Comment.findOne({
    _id: commentId,
    isDeleted: false,
  }).populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  if (comment.isHidden) {
    throw new AppError('Comment not found.', 404);
  }

  return comment;
};

export const updateComment = async (
  commentId: string,
  userId: string,
  input: UpdateCommentInput,
  userRole: string,
) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  const isOwner = comment.user.toString() === userId.toString();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isOwner && !isAdmin) {
    throw new AppError(
      'You do not have permission to update this comment.',
      403,
    );
  }

  comment.text = String(input.text);
  await comment.save();

  await comment.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return comment;
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: string,
) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  const isOwner = comment.user.toString() === userId.toString();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isOwner && !isAdmin) {
    throw new AppError(
      'You do not have permission to delete this comment.',
      403,
    );
  }

  await Comment.findByIdAndDelete(commentId);

  return { message: 'Comment deleted successfully.' };
};

export const toggleCommentLike = async (commentId: string, userId: string) => {
  const comment = await Comment.findOne({
    _id: commentId,
    isDeleted: false,
  });

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  if (comment.isHidden) {
    throw new AppError('Comment not found.', 404);
  }

  const likeIndex = comment.likes.findIndex(
    (id) => id.toString() === userId.toString(),
  );

  if (likeIndex > -1) {
    comment.likes.splice(likeIndex, 1);
  } else {
    comment.likes.push(userId as any);
  }

  await comment.save();

  await comment.populate({
    path: 'user',
    select: 'firstName lastName email profileImage',
  });

  return comment;
};

