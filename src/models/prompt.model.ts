/**
 * @swagger
 * components:
 *   schemas:
 *     Prompt:
 *       type: object
 *       required:
 *         - user
 *         - title
 *         - promptText
 *         - sampleOutput
 *         - mediaType
 *         - aiModel
 *       properties:
 *         _id:
 *           type: string
 *           description: Prompt ID
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           type: string
 *           description: User ID who created the prompt (references User model)
 *           example: 507f1f77bcf86cd799439011
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Prompt title
 *           example: Cyberpunk Cat in Neon City
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Optional description of the prompt
 *           example: A beautiful AI-generated image of a cat in a cyberpunk setting
 *         promptText:
 *           type: string
 *           minLength: 10
 *           description: The actual prompt text used to generate the output
 *           example: Create an image of a cyberpunk cat with neon lights
 *         sampleOutput:
 *           type: string
 *           description: URL or text showing the output result (image URL for image type, video/audio URL for media types, or text for text type)
 *           example: https://res.cloudinary.com/dxhkryxzk/image/upload/v1755980278/prompts/example.jpg
 *         mediaType:
 *           type: string
 *           enum: [text, image, video, audio]
 *           default: text
 *           description: Type of media the prompt generates
 *         aiModel:
 *           type: string
 *           maxLength: 100
 *           description: AI model used to generate the output
 *           example: DALL-E 3
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *           default: []
 *           description: Array of tags for categorization
 *           example: [art, cyberpunk, cat]
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked this prompt
 *         views:
 *           type: integer
 *           default: 0
 *           description: Number of times the prompt has been viewed
 *         isPublic:
 *           type: boolean
 *           default: true
 *           description: Whether the prompt is publicly visible
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Prompt creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
import mongoose, { Schema } from 'mongoose';
import { IPromptDocument } from '../types/prompt.types.js';

const promptSchema = new Schema<IPromptDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
    },

    promptText: {
      type: String,
      required: [true, 'Prompt text is required.'],
      trim: true,
    },

    sampleOutput: {
      type: String,
      required: [true, 'Sample output is required.'],
    },
    mediaType: {
      type: String,
      enum: {
        values: ['text', 'image', 'video', 'audio'],
        message: 'Media type must be: text, image, video, or audio',
      },
      default: 'text',
    },

    aiModel: {
      type: String,
      required: [true, 'AI model is required.'],
      trim: true,
      maxlength: [100, 'AI model name cannot exceed 100 characters.'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags.',
      },
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

promptSchema.index({ user: 1 });
promptSchema.index({ isPublic: 1, createdAt: -1 });
promptSchema.index({ tags: 1 });
promptSchema.index({ aiModel: 1 });

promptSchema.index({
  title: 'text',
  tags: 'text',
  promptText: 'text',
  description: 'text',
});

promptSchema.index({ isPublic: 1, createdAt: -1, aiModel: 1 });
promptSchema.index({ isPublic: 1, createdAt: -1, tags: 1 });

const Prompt = mongoose.model<IPromptDocument>('Prompt', promptSchema);

export default Prompt;
