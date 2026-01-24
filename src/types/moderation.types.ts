import { Document, Types } from 'mongoose';

export type ModerationReason =
  | 'spam'
  | 'inappropriate'
  | 'copyright'
  | 'policy_violation'
  | 'harassment'
  | 'other';

export type ContentType = 'prompt' | 'comment' | 'blog';

export type FlagStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export type FlagResolution =
  | 'content_hidden'
  | 'content_deleted'
  | 'user_warned'
  | 'no_action'
  | 'false_report';

export interface IContentFlagDocument extends Document {
  contentType: ContentType;
  contentId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: ModerationReason;
  description?: string;
  status: FlagStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  resolution?: FlagResolution;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

