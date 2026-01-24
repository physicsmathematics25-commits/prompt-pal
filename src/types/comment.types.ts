import { Document, Types } from 'mongoose';
import { ModerationReason } from './moderation.types.js';

export type ContentType = 'prompt' | 'blog';

export interface ICommentDocument extends Document {
  // Polymorphic reference
  contentType: ContentType;
  contentId: Types.ObjectId;
  // Legacy field for backward compatibility
  prompt?: Types.ObjectId;
  user: Types.ObjectId;
  text: string;
  likes: Types.ObjectId[];
  // Moderation fields
  isHidden: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  moderationReason?: ModerationReason;
  moderationNotes?: string;
  flaggedCount: number;
  lastFlaggedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

