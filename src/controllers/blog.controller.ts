import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as blogService from '../services/blog.service.js';
import * as commentService from '../services/comment.service.js';
import AppError from '../utils/appError.util.js';
import {
  BlogQueryParams,
  BlogIdParams,
  SlugParams,
  SectionIdParams,
} from '../validation/blog.schema.js';

/**
 * Create a new blog post
 * POST /api/v1/blogs
 */
export const createBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to create a blog.', 401);
    }

    const blog = await blogService.createBlog(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Get all blog posts with filters
 * GET /api/v1/blogs
 */
export const getBlogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as BlogQueryParams;
    const userId = req.user?.id;

    const data = await blogService.getBlogs(query, userId);

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
 * Get single blog by slug
 * GET /api/v1/blogs/slug/:slug
 */
export const getBlogBySlug = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;
    const userId = req.user?.id as string | undefined;

    const blog = await blogService.getBlogBySlug(slug, userId, req);

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Get single blog by ID
 * GET /api/v1/blogs/:id
 */
export const getBlogById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as BlogIdParams;
    const userId = req.user?.id;

    const blog = await blogService.getBlogById(id, userId);

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Update blog post
 * PATCH /api/v1/blogs/:id
 */
export const updateBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to update a blog.', 401);
    }

    const { id } = req.params as BlogIdParams;

    const blog = await blogService.updateBlog(
      id,
      req.user.id,
      req.body,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Delete blog post
 * DELETE /api/v1/blogs/:id
 */
export const deleteBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to delete a blog.', 401);
    }

    const { id } = req.params as BlogIdParams;

    const result = await blogService.deleteBlog(id, req.user.id, req.user.role);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  },
);

/**
 * Add section to blog post
 * POST /api/v1/blogs/:id/sections
 */
export const addSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to modify a blog.', 401);
    }

    const { id } = req.params as BlogIdParams;

    const blog = await blogService.addSection(
      id,
      req.user.id,
      req.body,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Update specific section
 * PATCH /api/v1/blogs/:id/sections/:sectionId
 */
export const updateSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to modify a blog.', 401);
    }

    const { id, sectionId } = req.params as SectionIdParams;

    const blog = await blogService.updateSection(
      id,
      sectionId,
      req.user.id,
      req.body,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Reorder sections
 * PATCH /api/v1/blogs/:id/sections/reorder
 */
export const reorderSections = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to modify a blog.', 401);
    }

    const { id } = req.params as BlogIdParams;
    const { sectionIds } = req.body;

    const blog = await blogService.reorderSections(
      id,
      sectionIds,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Delete section from blog post
 * DELETE /api/v1/blogs/:id/sections/:sectionId
 */
export const deleteSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to modify a blog.', 401);
    }

    const { id, sectionId } = req.params as SectionIdParams;

    const blog = await blogService.deleteSection(
      id,
      sectionId,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
    });
  },
);

/**
 * Toggle like on blog post
 * POST /api/v1/blogs/:id/like
 */
export const toggleLike = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to like a blog.', 401);
    }

    const { id } = req.params as BlogIdParams;

    const result = await blogService.toggleLike(id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);

/**
 * Increment share count
 * POST /api/v1/blogs/:id/share
 */
export const incrementShare = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as BlogIdParams;

    const result = await blogService.incrementShare(id);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);

/**
 * Get related blog posts
 * GET /api/v1/blogs/:id/related
 */
export const getRelatedBlogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as BlogIdParams;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 3;

    const blogs = await blogService.getRelatedBlogs(id, limit);

    res.status(200).json({
      status: 'success',
      results: blogs.length,
      data: {
        blogs,
      },
    });
  },
);

/**
 * Get blogs by author
 * GET /api/v1/blogs/author/:authorId
 */
export const getBlogsByAuthor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { authorId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const requestUserId = req.user?.id as string | undefined;

    const data = await blogService.getBlogsByAuthor(
      authorId,
      page,
      limit,
      requestUserId,
    );

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
 * Get prompt snippet for copy
 * GET /api/v1/blogs/:id/sections/:sectionId/prompt
 */
export const getPromptSnippet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, sectionId } = req.params as SectionIdParams;

    const blog = await blogService.getBlogById(id);
    const section = blog.sections.find(
      (s: any) => s._id?.toString() === sectionId,
    );

    if (!section || !section.promptSnippet) {
      throw new AppError('Prompt snippet not found.', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        fullPromptText: section.promptSnippet.fullPromptText,
        metadata: section.promptSnippet,
      },
    });
  },
);

/**
 * Upload blog cover image
 * POST /api/v1/blogs/upload/cover
 */
export const uploadCoverImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to upload images.', 401);
    }

    if (!req.file) {
      throw new AppError('Please provide an image file.', 400);
    }

    res.status(200).json({
      status: 'success',
      data: {
        imageUrl: req.file.path,
      },
    });
  },
);

/**
 * Upload blog section image
 * POST /api/v1/blogs/upload/section
 */
export const uploadSectionImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to upload images.', 401);
    }

    if (!req.file) {
      throw new AppError('Please provide an image file.', 400);
    }

    res.status(200).json({
      status: 'success',
      data: {
        imageUrl: req.file.path,
      },
    });
  },
);

/**
 * Get comments for a blog post
 * GET /api/v1/blogs/:id/comments
 */
export const getBlogComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as BlogIdParams;
    const query = req.query as any;

    const data = await commentService.getCommentsByContent(id, 'blog', query);

    res.status(200).json({
      status: 'success',
      results: data.comments.length,
      data: {
        comments: data.comments,
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
 * Create a comment on a blog post
 * POST /api/v1/blogs/:id/comments
 */
export const createBlogComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to comment.', 401);
    }

    const { id } = req.params as BlogIdParams;

    const comment = await commentService.createComment(
      id,
      'blog',
      req.user.id,
      req.body,
    );

    res.status(201).json({
      status: 'success',
      data: {
        comment,
      },
    });
  },
);

/**
 * Update a comment on a blog post
 * PATCH /api/v1/blogs/:id/comments/:commentId
 */
export const updateBlogComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to update comments.', 401);
    }

    const { commentId } = req.params;

    const comment = await commentService.updateComment(
      commentId,
      req.user.id,
      req.body,
      req.user.role,
    );

    res.status(200).json({
      status: 'success',
      data: {
        comment,
      },
    });
  },
);

/**
 * Delete a comment from a blog post
 * DELETE /api/v1/blogs/:id/comments/:commentId
 */
export const deleteBlogComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to delete comments.', 401);
    }

    const { commentId } = req.params;

    await commentService.deleteComment(commentId, req.user.id, req.user.role);

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully.',
    });
  },
);

/**
 * Get user's liked/bookmarked blogs
 * GET /api/v1/blogs/bookmarks
 */
export const getUserBookmarkedBlogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to view bookmarks.', 401);
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const data = await blogService.getLikedBlogs(req.user.id, page, limit);

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
 * Get tag cloud
 * GET /api/v1/blogs/tags/cloud
 */
export const getTagCloud = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const tags = await blogService.getTagCloud(limit);

    res.status(200).json({
      status: 'success',
      results: tags.length,
      data: {
        tags,
      },
    });
  },
);

/**
 * Get trending tags
 * GET /api/v1/blogs/tags/trending
 */
export const getTrendingTags = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const tags = await blogService.getTrendingTags(days, limit);

    res.status(200).json({
      status: 'success',
      results: tags.length,
      data: {
        tags,
      },
    });
  },
);

/**
 * Get blog statistics
 * GET /api/v1/blogs/stats
 */
export const getBlogStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await blogService.getBlogStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  },
);

/**
 * Get popular blogs
 * GET /api/v1/blogs/popular
 */
export const getPopularBlogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const metric = (req.query.metric as 'views' | 'likes' | 'shares') || 'views';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;

    const blogs = await blogService.getPopularBlogs(metric, limit, days);

    res.status(200).json({
      status: 'success',
      results: blogs.length,
      data: {
        blogs,
      },
    });
  },
);

/**
 * Get all categories with statistics
 * GET /api/v1/blogs/categories
 */
export const getCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categories = await blogService.getCategories();

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories,
      },
    });
  },
);

