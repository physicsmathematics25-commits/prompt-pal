import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/fileUpload.util.js';
import * as promptController from '../controllers/prompt.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPromptSchema,
  updatePromptSchema,
  feedQuerySchema,
  getPromptSchema,
} from '../validation/prompt.schema.js';
import commentRoutes from './comment.routes.js';

const router = Router();

/**
 * @swagger
 * /prompts:
 *   get:
 *     summary: Get prompts feed
 *     tags: [Prompts]
 *     description: Retrieve a paginated list of public prompts with optional filtering by tag, AI model, and text search.
 *     parameters:
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
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter prompts by tag (optional)
 *         example: art
 *       - in: query
 *         name: aiModel
 *         schema:
 *           type: string
 *         description: Filter prompts by AI model (optional)
 *         example: GPT-4
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search prompts by title, description, prompt text, or tags (optional)
 *         example: marketing
 *     responses:
 *       200:
 *         description: Successfully retrieved prompts feed
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
 *                     prompts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Prompt'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 */
router.get('/', validate(feedQuerySchema, 'query'), promptController.getFeed);

/**
 * @swagger
 * /prompts/my:
 *   get:
 *     summary: Get user's own prompts
 *     tags: [Prompts]
 *     description: Retrieve a paginated list of prompts created by the authenticated user with optional filtering by tag, AI model, and text search.
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter prompts by tag (optional)
 *         example: art
 *       - in: query
 *         name: aiModel
 *         schema:
 *           type: string
 *         description: Filter prompts by AI model (optional)
 *         example: GPT-4
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search prompts by title, description, prompt text, or tags (optional)
 *         example: marketing
 *     responses:
 *       200:
 *         description: Successfully retrieved user's prompts
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
 *                     prompts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Prompt'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get(
  '/my',
  protect,
  validate(feedQuerySchema, 'query'),
  promptController.getUserPrompts,
);

/**
 * @swagger
 * /prompts/favorites:
 *   get:
 *     summary: Get user's favorite prompts
 *     tags: [Prompts]
 *     description: Retrieve a paginated list of prompts that the authenticated user has liked (favorited) with optional filtering by tag, AI model, and text search.
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter prompts by tag (optional)
 *         example: art
 *       - in: query
 *         name: aiModel
 *         schema:
 *           type: string
 *         description: Filter prompts by AI model (optional)
 *         example: GPT-4
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search prompts by title, description, prompt text, or tags (optional)
 *         example: marketing
 *     responses:
 *       200:
 *         description: Successfully retrieved user's favorite prompts
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
 *                     prompts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Prompt'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get(
  '/favorites',
  protect,
  validate(feedQuerySchema, 'query'),
  promptController.getUserFavorites,
);

/**
 * @swagger
 * /prompts/{id}:
 *   get:
 *     summary: Get prompt by ID
 *     tags: [Prompts]
 *     description: Retrieve a single prompt by its ID. Automatically increments the view count.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved prompt
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
 *                     prompt:
 *                       $ref: '#/components/schemas/Prompt'
 *       404:
 *         description: Prompt not found
 */
router.get(
  '/:id',
  validate(getPromptSchema, 'params'),
  promptController.getPrompt,
);

/**
 * @swagger
 * /prompts:
 *   post:
 *     summary: Create a new prompt
 *     tags: [Prompts]
 *     description: Create a new prompt. For image media type, upload an image file. For other media types, provide sampleOutput in the request body.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - promptText
 *               - mediaType
 *               - aiModel
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: Cyberpunk Cat in Neon City
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: A beautiful AI-generated image of a cat in a cyberpunk setting
 *               promptText:
 *                 type: string
 *                 minLength: 10
 *                 example: Create an image of a cyberpunk cat with neon lights
 *               sampleOutput:
 *                 type: string
 *                 description: Required for text/video/audio media types. Ignored if image is uploaded.
 *                 example: https://example.com/video.mp4
 *               mediaType:
 *                 type: string
 *                 enum: [text, image, video, audio]
 *                 example: image
 *               aiModel:
 *                 type: string
 *                 maxLength: 100
 *                 example: DALL-E 3
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: [art, cyberpunk, cat]
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (required if mediaType is 'image')
 *     responses:
 *       201:
 *         description: Prompt created successfully
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
 *                     prompt:
 *                       $ref: '#/components/schemas/Prompt'
 *       400:
 *         description: Bad request - validation error or missing required fields
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.post(
  '/',
  protect,
  upload.single('image'),
  validate(createPromptSchema, 'body'),
  promptController.createPrompt,
);

/**
 * @swagger
 * /prompts/{id}:
 *   patch:
 *     summary: Update a prompt
 *     tags: [Prompts]
 *     description: Update a prompt. Only the owner or an admin can update a prompt. All fields are optional.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               promptText:
 *                 type: string
 *                 minLength: 10
 *               sampleOutput:
 *                 type: string
 *               mediaType:
 *                 type: string
 *                 enum: [text, image, video, audio]
 *               aiModel:
 *                 type: string
 *                 maxLength: 100
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Prompt updated successfully
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
 *                     prompt:
 *                       $ref: '#/components/schemas/Prompt'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - only owner or admin can update
 *       404:
 *         description: Prompt not found
 */
router.patch(
  '/:id',
  protect,
  validate(getPromptSchema, 'params'),
  validate(updatePromptSchema, 'body'),
  promptController.updatePrompt,
);

/**
 * @swagger
 * /prompts/{id}:
 *   delete:
 *     summary: Delete a prompt
 *     tags: [Prompts]
 *     description: Delete a prompt. Only the owner or an admin can delete a prompt. If the prompt has an image, it will be deleted from Cloudinary as well.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Prompt deleted successfully
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
 *                   example: Prompt deleted successfully.
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - only owner or admin can delete
 *       404:
 *         description: Prompt not found
 */
router.delete(
  '/:id',
  protect,
  validate(getPromptSchema, 'params'),
  promptController.deletePrompt,
);

/**
 * @swagger
 * /prompts/{id}/like:
 *   post:
 *     summary: Like or unlike a prompt
 *     tags: [Prompts]
 *     description: Toggle like status for a prompt. If the user has already liked the prompt, it will be unliked.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Like status toggled successfully
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
 *                     prompt:
 *                       $ref: '#/components/schemas/Prompt'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       404:
 *         description: Prompt not found
 */
router.post(
  '/:id/like',
  protect,
  validate(getPromptSchema, 'params'),
  promptController.toggleLike,
);

// Mount comment routes as nested routes
router.use('/:promptId/comments', commentRoutes);

export default router;

