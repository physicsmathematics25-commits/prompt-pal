/**
 * @swagger
 * components:
 *   schemas:
 *     ContentFlag:
 *       type: object
 *       required:
 *         - contentType
 *         - contentId
 *         - reportedBy
 *         - reason
 *       properties:
 *         _id:
 *           type: string
 *           description: Flag ID
 *           example: 507f1f77bcf86cd799439011
 *         contentType:
 *           type: string
 *           enum: [prompt, comment, blog]
 *           description: Type of content being flagged
 *           example: prompt
 *         contentId:
 *           type: string
 *           description: ID of the content being flagged (references Prompt or Comment)
 *           example: 507f1f77bcf86cd799439011
 *         reportedBy:
 *           type: string
 *           description: User ID who reported the content (references User)
 *           example: 507f1f77bcf86cd799439012
 *         reason:
 *           type: string
 *           enum: [spam, inappropriate, copyright, harassment, other]
 *           description: Reason for flagging the content
 *           example: spam
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Optional description of the issue
 *           example: This content contains spam links
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *           default: pending
 *           description: Current status of the flag
 *           example: pending
 *         reviewedBy:
 *           type: string
 *           description: Admin user ID who reviewed the flag (references User)
 *           example: 507f1f77bcf86cd799439013
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the flag was reviewed
 *         resolution:
 *           type: string
 *           enum: [content_hidden, content_deleted, user_warned, no_action, false_report]
 *           description: Action taken after review
 *           example: content_hidden
 *         resolutionNotes:
 *           type: string
 *           maxLength: 1000
 *           description: Notes about the resolution
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Flag creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
import mongoose, { Schema, SchemaDefinition } from 'mongoose';
import {
  IContentFlagDocument,
  ContentType,
  ModerationReason,
  FlagStatus,
  FlagResolution,
} from '../types/moderation.types.js';

const contentFlagSchemaDefinition: SchemaDefinition<IContentFlagDocument> = {
  contentType: {
    type: String,
    enum: {
      values: ['prompt', 'comment', 'blog'] as ContentType[],
      message: 'Content type must be: prompt, comment, or blog',
    },
    required: [true, 'Content type is required.'],
    index: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Content ID is required.'],
    index: true,
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reported by user is required.'],
    index: true,
  },
  reason: {
    type: String,
    enum: {
      values: [
        'spam',
        'inappropriate',
        'copyright',
        'harassment',
        'other',
      ] as ModerationReason[],
      message:
        'Reason must be: spam, inappropriate, copyright, harassment, or other',
    },
    required: [true, 'Reason is required.'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters.'],
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'reviewed', 'resolved', 'dismissed'] as FlagStatus[],
      message:
        'Status must be: pending, reviewed, resolved, or dismissed',
    },
    default: 'pending',
    index: true,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  resolution: {
    type: String,
    enum: {
      values: [
        'content_hidden',
        'content_deleted',
        'user_warned',
        'no_action',
        'false_report',
      ] as FlagResolution[],
      message:
        'Resolution must be: content_hidden, content_deleted, user_warned, no_action, or false_report',
    },
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution notes cannot exceed 1000 characters.'],
  },
};

const contentFlagSchema = new Schema<IContentFlagDocument>(
  contentFlagSchemaDefinition,
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for efficient queries
contentFlagSchema.index({ contentType: 1, contentId: 1 });
contentFlagSchema.index({ status: 1, createdAt: -1 });
contentFlagSchema.index({ reportedBy: 1 });
contentFlagSchema.index({ reviewedBy: 1 });
contentFlagSchema.index({ contentType: 1, status: 1, createdAt: -1 });

const ContentFlag = mongoose.model<IContentFlagDocument>(
  'ContentFlag',
  contentFlagSchema,
);

export default ContentFlag;

