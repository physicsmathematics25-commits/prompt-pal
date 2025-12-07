import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as adminController from '../controllers/admin.controller.js';
import {
  getUsersAdminSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from '../validation/admin.validation.js';
import { getUserSchema } from '../validation/user.schema.js';

const router = Router();

router.use(protect, restrictTo('admin', 'superadmin'));

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Change user role
 *     tags: [Admin]
 *     description: Change a user's role (user, admin, or superadmin). **Restricted to SUPERADMIN only.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: New role to assign to the user
 *                 example: admin
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User role updated to admin.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         role:
 *                           type: string
 *                           example: admin
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *       400:
 *         description: Bad request - invalid ID or role value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - superadmin role required
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/role',
  restrictTo('superadmin'),
  validate(getUserSchema, 'params'),
  validate(updateUserRoleSchema, 'body'),
  adminController.updateUserRoleHandler,
);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin view)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all users with filtering by role, status, and search. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email (optional)
 *         example: john
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, superadmin]
 *         description: Filter users by role (optional)
 *         example: user
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, blocked]
 *         description: Filter users by status (optional)
 *         example: approved
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *         example: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved users with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   description: Total number of users matching the query
 *                   example: 500
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 25
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.get(
  '/users',
  validate(getUsersAdminSchema, 'query'),
  adminController.getAllUsersAdminHandler,
);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin]
 *     description: Update the status of a user (pending, approved, or blocked). Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, blocked]
 *                 description: New status for the user
 *                 example: approved
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User status updated to approved.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         status:
 *                           type: string
 *                           example: approved
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *       400:
 *         description: Bad request - invalid ID or status value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/status',
  validate(getUserSchema, 'params'),
  validate(updateUserStatusSchema, 'body'),
  adminController.updateUserStatusHandler,
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details (Admin view)
 *     tags: [Admin]
 *     description: Retrieve detailed information about a specific user. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:id',
  validate(getUserSchema, 'params'),
  adminController.getUserDetailsHandler,
);

export default router;
