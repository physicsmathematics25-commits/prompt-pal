import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as blogAdminController from '../controllers/blogAdmin.controller.js';

const router = Router();

// All routes require admin or superadmin
router.use(protect, restrictTo('admin', 'superadmin'));

/**
 * @swagger
 * /admin/blogs/moderation:
 *   get:
 *     summary: Get moderation queue
 *     tags: [Admin - Blogs]
 *     description: Get blogs requiring moderation (flagged, hidden, etc.)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [flagged, hidden, all]
 *         description: Filter by moderation status
 *     responses:
 *       200:
 *         description: Successfully retrieved moderation queue
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/moderation', blogAdminController.getModerationQueue);

/**
 * @swagger
 * /admin/blogs/flagged:
 *   get:
 *     summary: Get flagged blogs with flag details
 *     tags: [Admin - Blogs]
 *     description: Get all flagged blogs with detailed flag information
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved flagged blogs
 */
router.get('/flagged', blogAdminController.getFlaggedBlogs);

/**
 * @swagger
 * /admin/blogs/analytics:
 *   get:
 *     summary: Get blog analytics
 *     tags: [Admin - Blogs]
 *     description: Get comprehensive blog platform analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                     engagement:
 *                       type: object
 *                     topAuthors:
 *                       type: array
 *                     categoryStats:
 *                       type: array
 *                     recentFlags:
 *                       type: array
 */
router.get('/analytics', blogAdminController.getBlogAnalytics);

/**
 * @swagger
 * /admin/blogs/{id}/hide:
 *   post:
 *     summary: Hide a blog post
 *     tags: [Admin - Blogs]
 *     description: Hide a blog post from public view (moderation action)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [spam, inappropriate, copyright, policy_violation, harassment, other]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Blog hidden successfully
 */
router.post('/:id/hide', blogAdminController.hideBlog);

/**
 * @swagger
 * /admin/blogs/{id}/unhide:
 *   post:
 *     summary: Unhide a blog post
 *     tags: [Admin - Blogs]
 *     description: Make a hidden blog post visible again
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog unhidden successfully
 */
router.post('/:id/unhide', blogAdminController.unhideBlog);

/**
 * @swagger
 * /admin/blogs/{id}:
 *   delete:
 *     summary: Soft delete a blog post
 *     tags: [Admin - Blogs]
 *     description: Soft delete a blog post (can be restored later)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for deletion
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 */
router.delete('/:id', blogAdminController.softDeleteBlog);

/**
 * @swagger
 * /admin/blogs/{id}/restore:
 *   post:
 *     summary: Restore a soft-deleted blog
 *     tags: [Admin - Blogs]
 *     description: Restore a previously deleted blog post
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog restored successfully
 */
router.post('/:id/restore', blogAdminController.restoreBlog);

/**
 * @swagger
 * /admin/blogs/{id}/dismiss-flags:
 *   post:
 *     summary: Dismiss all flags for a blog
 *     tags: [Admin - Blogs]
 *     description: Mark all flags as reviewed with no action taken
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Review notes
 *     responses:
 *       200:
 *         description: Flags dismissed successfully
 */
router.post('/:id/dismiss-flags', blogAdminController.dismissBlogFlags);

/**
 * @swagger
 * /admin/blogs/{id}/history:
 *   get:
 *     summary: Get blog moderation history
 *     tags: [Admin - Blogs]
 *     description: Get complete moderation history for a blog post
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Successfully retrieved history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     blog:
 *                       type: object
 *                     flags:
 *                       type: array
 */
router.get('/:id/history', blogAdminController.getBlogModerationHistory);

/**
 * @swagger
 * /admin/blogs/bulk:
 *   post:
 *     summary: Bulk moderation action
 *     tags: [Admin - Blogs]
 *     description: Perform moderation action on multiple blogs at once
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blogIds
 *               - action
 *             properties:
 *               blogIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 50
 *                 description: Array of blog IDs (max 50)
 *               action:
 *                 type: string
 *                 enum: [hide, unhide, delete, restore]
 *               reason:
 *                 type: string
 *                 description: Reason for action (required for hide/delete)
 *     responses:
 *       200:
 *         description: Bulk action completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: array
 *                       items:
 *                         type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/bulk', blogAdminController.bulkModerationAction);

export default router;

