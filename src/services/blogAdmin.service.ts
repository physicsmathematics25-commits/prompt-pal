import BlogPost from '../models/blog.model.js';
import Comment from '../models/comment.model.js';
import ContentFlag from '../models/contentFlag.model.js';
import AppError from '../utils/appError.util.js';

/**
 * Get moderation queue - blogs with high flag counts or pending review
 */
export const getModerationQueue = async (
  page: number = 1,
  limit: number = 20,
  status?: 'flagged' | 'hidden' | 'all',
) => {
  const skip = (page - 1) * limit;

  const filter: any = {
    isDeleted: false,
  };

  // Filter based on status
  if (status === 'flagged') {
    filter.flaggedCount = { $gt: 0 };
  } else if (status === 'hidden') {
    filter.isHidden = true;
  }
  // 'all' means no additional filter

  const blogs = await BlogPost.find(filter)
    .populate({
      path: 'author',
      select: 'firstName lastName email profileImage',
    })
    .select(
      'title slug category status isPublic isHidden flaggedCount lastFlaggedAt moderationReason moderationNotes publishDate views likes shares',
    )
    .sort({ flaggedCount: -1, lastFlaggedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await BlogPost.countDocuments(filter);

  return {
    blogs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

/**
 * Get flagged content with flag details
 */
export const getFlaggedBlogs = async (
  page: number = 1,
  limit: number = 20,
) => {
  const skip = (page - 1) * limit;

  // Get blogs with flags
  const blogs = await BlogPost.find({
    isDeleted: false,
    flaggedCount: { $gt: 0 },
  })
    .populate({
      path: 'author',
      select: 'firstName lastName email profileImage',
    })
    .select('title slug flaggedCount lastFlaggedAt isHidden moderationReason')
    .sort({ flaggedCount: -1, lastFlaggedAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get flag details for each blog
  const blogsWithFlags = await Promise.all(
    blogs.map(async (blog) => {
      const flags = await ContentFlag.find({
        contentId: blog._id,
        contentType: 'blog',
        status: 'pending',
      })
        .populate({
          path: 'reportedBy',
          select: 'firstName lastName email',
        })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        ...blog.toObject(),
        flags,
      };
    }),
  );

  const total = await BlogPost.countDocuments({
    isDeleted: false,
    flaggedCount: { $gt: 0 },
  });

  return {
    blogs: blogsWithFlags,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
};

/**
 * Hide a blog post (moderation action)
 */
export const hideBlog = async (
  blogId: string,
  adminId: string,
  reason: string,
  notes?: string,
) => {
  const blog = await BlogPost.findById(blogId);

  if (!blog) {
    throw new AppError('Blog post not found.', 404);
  }

  if (blog.isDeleted) {
    throw new AppError('Cannot hide a deleted blog post.', 400);
  }

  blog.isHidden = true;
  blog.moderationReason = reason as any;
  blog.moderationNotes = notes;
  blog.status = 'hidden';

  await blog.save();

  // Mark related flags as resolved
  await ContentFlag.updateMany(
    {
      contentId: blogId,
      contentType: 'blog',
      status: 'pending',
    },
    {
      $set: {
        status: 'resolved',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution: 'content_hidden',
      },
    },
  );

  return blog;
};

/**
 * Unhide a blog post
 */
export const unhideBlog = async (blogId: string, adminId: string) => {
  const blog = await BlogPost.findById(blogId);

  if (!blog) {
    throw new AppError('Blog post not found.', 404);
  }

  blog.isHidden = false;
  blog.status = 'published';
  blog.moderationReason = undefined;
  blog.moderationNotes = undefined;

  await blog.save();

  return blog;
};

/**
 * Soft delete a blog post (admin action)
 */
export const softDeleteBlog = async (
  blogId: string,
  adminId: string,
  reason?: string,
) => {
  const blog = await BlogPost.findById(blogId);

  if (!blog) {
    throw new AppError('Blog post not found.', 404);
  }

  if (blog.isDeleted) {
    throw new AppError('Blog post is already deleted.', 400);
  }

  blog.isDeleted = true;
  blog.deletedAt = new Date();
  blog.deletedBy = adminId as any;
  blog.isHidden = true;
  blog.status = 'hidden';
  if (reason) {
    blog.moderationNotes = reason;
  }

  await blog.save();

  // Mark related flags as resolved
  await ContentFlag.updateMany(
    {
      contentId: blogId,
      contentType: 'blog',
      status: 'pending',
    },
    {
      $set: {
        status: 'resolved',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution: 'content_deleted',
      },
    },
  );

  return blog;
};

/**
 * Restore a soft-deleted blog
 */
export const restoreBlog = async (blogId: string, adminId: string) => {
  const blog = await BlogPost.findById(blogId);

  if (!blog) {
    throw new AppError('Blog post not found.', 404);
  }

  if (!blog.isDeleted) {
    throw new AppError('Blog post is not deleted.', 400);
  }

  blog.isDeleted = false;
  blog.deletedAt = undefined;
  blog.deletedBy = undefined;
  blog.isHidden = false;
  blog.status = 'published';

  await blog.save();

  return blog;
};

/**
 * Dismiss flags for a blog (mark as reviewed, no action)
 */
export const dismissBlogFlags = async (
  blogId: string,
  adminId: string,
  notes?: string,
) => {
  const blog = await BlogPost.findById(blogId);

  if (!blog) {
    throw new AppError('Blog post not found.', 404);
  }

  // Mark flags as dismissed
  await ContentFlag.updateMany(
    {
      contentId: blogId,
      contentType: 'BlogPost',
      status: 'pending',
    },
    {
      $set: {
        status: 'dismissed',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution: 'no_violation',
        notes: notes || 'Reviewed by admin - no violation found',
      },
    },
  );

  // Reset flag count
  blog.flaggedCount = 0;
  blog.lastFlaggedAt = undefined;

  await blog.save();

  return blog;
};

/**
 * Get admin analytics for blogs
 */
export const getBlogAnalytics = async (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Overall stats
  const overallStats = await BlogPost.aggregate([
    {
      $facet: {
        total: [
          { $match: { isDeleted: false } },
          { $count: 'count' },
        ],
        published: [
          { $match: { isDeleted: false, status: 'published' } },
          { $count: 'count' },
        ],
        drafts: [
          { $match: { isDeleted: false, status: 'draft' } },
          { $count: 'count' },
        ],
        hidden: [
          { $match: { isDeleted: false, isHidden: true } },
          { $count: 'count' },
        ],
        flagged: [
          { $match: { isDeleted: false, flaggedCount: { $gt: 0 } } },
          { $count: 'count' },
        ],
        deleted: [
          { $match: { isDeleted: true } },
          { $count: 'count' },
        ],
        recentPublished: [
          {
            $match: {
              isDeleted: false,
              status: 'published',
              publishDate: { $gte: startDate },
            },
          },
          { $count: 'count' },
        ],
      },
    },
  ]);

  // Engagement stats
  const engagementStats = await BlogPost.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'published',
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
        totalShares: { $sum: '$shares' },
        avgViews: { $avg: '$views' },
        avgLikes: { $avg: { $size: '$likes' } },
        avgShares: { $avg: '$shares' },
      },
    },
  ]);

  // Top authors
  const topAuthors = await BlogPost.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'published',
      },
    },
    {
      $group: {
        _id: '$author',
        blogCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
        totalShares: { $sum: '$shares' },
      },
    },
    { $sort: { blogCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        author: {
          _id: '$author._id',
          firstName: '$author.firstName',
          lastName: '$author.lastName',
          email: '$author.email',
          profileImage: '$author.profileImage',
        },
        blogCount: 1,
        totalViews: 1,
        totalLikes: 1,
        totalShares: 1,
      },
    },
  ]);

  // Category distribution
  const categoryStats = await BlogPost.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'published',
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Recent moderation actions
  const recentFlags = await ContentFlag.find({
    contentType: 'BlogPost',
    createdAt: { $gte: startDate },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate({
      path: 'reporter',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'contentId',
      select: 'title slug',
    });

  return {
    overview: {
      total: overallStats[0].total[0]?.count || 0,
      published: overallStats[0].published[0]?.count || 0,
      drafts: overallStats[0].drafts[0]?.count || 0,
      hidden: overallStats[0].hidden[0]?.count || 0,
      flagged: overallStats[0].flagged[0]?.count || 0,
      deleted: overallStats[0].deleted[0]?.count || 0,
      recentPublished: overallStats[0].recentPublished[0]?.count || 0,
    },
    engagement: engagementStats[0] || {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      avgViews: 0,
      avgLikes: 0,
      avgShares: 0,
    },
    topAuthors,
    categoryStats,
    recentFlags,
    period: `Last ${days} days`,
  };
};

/**
 * Get blog moderation history
 */
export const getBlogModerationHistory = async (blogId: string) => {
  const blog = await BlogPost.findById(blogId)
    .populate({
      path: 'author',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'deletedBy',
      select: 'firstName lastName email',
    });

  if (!blog) {
    throw new AppError('Blog post not found.', 404);
  }

  // Get all flags for this blog
  const flags = await ContentFlag.find({
    contentId: blogId,
    contentType: 'BlogPost',
  })
    .populate({
      path: 'reporter',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'resolvedBy',
      select: 'firstName lastName email',
    })
    .sort({ createdAt: -1 });

  return {
    blog: {
      _id: blog._id,
      title: blog.title,
      slug: blog.slug,
      author: blog.author,
      status: blog.status,
      isHidden: blog.isHidden,
      isDeleted: blog.isDeleted,
      deletedAt: blog.deletedAt,
      deletedBy: blog.deletedBy,
      moderationReason: blog.moderationReason,
      moderationNotes: blog.moderationNotes,
      flaggedCount: blog.flaggedCount,
      lastFlaggedAt: blog.lastFlaggedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    },
    flags,
  };
};

/**
 * Bulk moderation action
 */
export const bulkModerationAction = async (
  blogIds: string[],
  action: 'hide' | 'unhide' | 'delete' | 'restore',
  adminId: string,
  reason?: string,
) => {
  if (!blogIds || blogIds.length === 0) {
    throw new AppError('No blog IDs provided.', 400);
  }

  if (blogIds.length > 50) {
    throw new AppError('Cannot perform bulk action on more than 50 blogs at once.', 400);
  }

  const results = {
    success: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const blogId of blogIds) {
    try {
      switch (action) {
        case 'hide':
          await hideBlog(blogId, adminId, reason || 'bulk_moderation');
          break;
        case 'unhide':
          await unhideBlog(blogId, adminId);
          break;
        case 'delete':
          await softDeleteBlog(blogId, adminId, reason);
          break;
        case 'restore':
          await restoreBlog(blogId, adminId);
          break;
        default:
          throw new AppError('Invalid bulk action.', 400);
      }
      results.success.push(blogId);
    } catch (error: any) {
      results.failed.push({
        id: blogId,
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
};

