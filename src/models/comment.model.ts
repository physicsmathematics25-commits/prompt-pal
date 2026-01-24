/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - prompt
 *         - user
 *         - text
 *       properties:
 *         _id:
 *           type: string
 *           description: Comment ID
 *           example: 507f1f77bcf86cd799439011
 *         prompt:
 *           type: string
 *           description: Prompt ID this comment belongs to (references Prompt model)
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           type: string
 *           description: User ID who created the comment (references User model)
 *           example: 507f1f77bcf86cd799439011
 *         text:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: Comment text content
 *           example: This prompt worked great for my project!
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked this comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Comment creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         isHidden:
 *           type: boolean
 *           default: false
 *           description: Whether the comment is hidden from public view
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           description: Whether the comment is soft-deleted
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the comment was deleted
 *         deletedBy:
 *           type: string
 *           description: Admin user ID who deleted the comment (references User)
 *         moderationReason:
 *           type: string
 *           enum: [spam, inappropriate, harassment, other]
 *           description: Reason for moderation action
 *         moderationNotes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes about the moderation action
 *         flaggedCount:
 *           type: integer
 *           default: 0
 *           description: Number of times this comment has been flagged
 *         lastFlaggedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the most recent flag
 */
import mongoose, { Schema, SchemaDefinition } from 'mongoose';
import { ICommentDocument } from '../types/comment.types.js';

const commentSchemaDefinition: SchemaDefinition<ICommentDocument> = {
  // Polymorphic reference - can be either Prompt or BlogPost
  contentType: {
    type: String,
    required: [true, 'Content type is required.'],
    enum: {
      values: ['prompt', 'blog'],
      message: 'Content type must be either prompt or blog',
    },
    index: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Content ID is required.'],
    refPath: 'contentType',
    index: true,
  },
  // Legacy field for backward compatibility
  prompt: {
    type: Schema.Types.ObjectId,
    ref: 'Prompt',
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required.'],
    index: true,
  },
  text: {
    type: String,
    required: [true, 'Comment text is required.'],
    trim: true,
    minlength: [1, 'Comment text cannot be empty.'],
    maxlength: [1000, 'Comment text cannot exceed 1000 characters.'],
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // Moderation fields
  isHidden: {
    type: Boolean,
    default: false,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  moderationReason: {
    type: String,
    enum: {
      values: ['spam', 'inappropriate', 'harassment', 'other'],
      message:
        'Moderation reason must be: spam, inappropriate, harassment, or other',
    },
  },
  moderationNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Moderation notes cannot exceed 500 characters.'],
  },
  flaggedCount: {
    type: Number,
    default: 0,
  },
  lastFlaggedAt: {
    type: Date,
  },
};

const commentSchema = new Schema<ICommentDocument>(commentSchemaDefinition, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save hook to maintain backward compatibility
commentSchema.pre('save', function (next) {
  // If using legacy prompt field, set contentType and contentId
  if (this.prompt && !this.contentId) {
    this.contentType = 'prompt';
    this.contentId = this.prompt;
  }
  // If using contentType='prompt', also set legacy prompt field
  if (this.contentType === 'prompt' && this.contentId) {
    this.prompt = this.contentId;
  }
  next();
});

// Indexes for efficient queries
commentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });
commentSchema.index({ prompt: 1, createdAt: -1 }); // Legacy index
commentSchema.index({ user: 1 });
commentSchema.index({ contentId: 1, likes: 1 });

// Moderation indexes
commentSchema.index({ isHidden: 1, isDeleted: 1, createdAt: -1 });
commentSchema.index({ flaggedCount: -1, lastFlaggedAt: -1 });
commentSchema.index({ deletedBy: 1 });
commentSchema.index({ contentId: 1, isHidden: 1, isDeleted: 1, createdAt: -1 });

const Comment = mongoose.model<ICommentDocument>('Comment', commentSchema);

export default Comment;

