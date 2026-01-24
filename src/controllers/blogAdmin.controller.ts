import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as blogAdminService from '../services/blogAdmin.service.js';
import AppError from '../utils/appError.util.js';

/**
 * Get moderation queue
 * GET /api/v1/admin/blogs/moderation
 */
export const getModerationQueue = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const status = req.query.status as 'flagged' | 'hidden' | 'all' | undefined;

    const data = await blogAdminService.getModerationQueue(page, limit, status);

    res.status(200).json({
      status: 'success',
      results: data.blogs.length,
      data: {
        blogs: data.blogs,
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

/**
 * Get flagged blogs with flag details
 * GET /api/v1/admin/blogs/flagged
 */
export const getFlaggedBlogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const data = await blogAdminService.getFlaggedBlogs(page, limit);

    res.status(200).json({
      status: 'success',
      results: data.blogs.length,
      data: {
        blogs: data.blogs,
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

/**
 * Hide a blog post
 * POST /api/v1/admin/blogs/:id/hide
 */
export const hideBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in.', 401);
    }

    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      throw new AppError('Moderation reason is required.', 400);
    }

    const blog = await blogAdminService.hideBlog(id, req.user.id, reason, notes);

    res.status(200).json({
      status: 'success',
      message: 'Blog post hidden successfully.',
      data: {
        blog,
      },
    });
  },
);

/**
 * Unhide a blog post
 * POST /api/v1/admin/blogs/:id/unhide
 */
export const unhideBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in.', 401);
    }

    const { id } = req.params;

    const blog = await blogAdminService.unhideBlog(id, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Blog post unhidden successfully.',
      data: {
        blog,
      },
    });
  },
);

/**
 * Soft delete a blog post
 * DELETE /api/v1/admin/blogs/:id
 */
export const softDeleteBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in.', 401);
    }

    const { id } = req.params;
    const { reason } = req.body;

    const blog = await blogAdminService.softDeleteBlog(id, req.user.id, reason);

    res.status(200).json({
      status: 'success',
      message: 'Blog post deleted successfully.',
      data: {
        blog,
      },
    });
  },
);

/**
 * Restore a soft-deleted blog
 * POST /api/v1/admin/blogs/:id/restore
 */
export const restoreBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in.', 401);
    }

    const { id } = req.params;

    const blog = await blogAdminService.restoreBlog(id, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Blog post restored successfully.',
      data: {
        blog,
      },
    });
  },
);

/**
 * Dismiss flags for a blog
 * POST /api/v1/admin/blogs/:id/dismiss-flags
 */
export const dismissBlogFlags = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in.', 401);
    }

    const { id } = req.params;
    const { notes } = req.body;

    const blog = await blogAdminService.dismissBlogFlags(id, req.user.id, notes);

    res.status(200).json({
      status: 'success',
      message: 'Flags dismissed successfully.',
      data: {
        blog,
      },
    });
  },
);

/**
 * Get blog analytics
 * GET /api/v1/admin/blogs/analytics
 */
export const getBlogAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    const analytics = await blogAdminService.getBlogAnalytics(days);

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
  },
);

/**
 * Get blog moderation history
 * GET /api/v1/admin/blogs/:id/history
 */
export const getBlogModerationHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const history = await blogAdminService.getBlogModerationHistory(id);

    res.status(200).json({
      status: 'success',
      data: history,
    });
  },
);

/**
 * Bulk moderation action
 * POST /api/v1/admin/blogs/bulk
 */
export const bulkModerationAction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in.', 401);
    }

    const { blogIds, action, reason } = req.body;

    if (!blogIds || !Array.isArray(blogIds)) {
      throw new AppError('blogIds must be an array.', 400);
    }

    if (!action || !['hide', 'unhide', 'delete', 'restore'].includes(action)) {
      throw new AppError('Invalid action. Must be: hide, unhide, delete, or restore.', 400);
    }

    const results = await blogAdminService.bulkModerationAction(
      blogIds,
      action,
      req.user.id,
      reason,
    );

    res.status(200).json({
      status: 'success',
      message: `Bulk action completed. ${results.success.length} succeeded, ${results.failed.length} failed.`,
      data: results,
    });
  },
);

