import { Document, Types } from 'mongoose';

export type MediaType = 'text' | 'image' | 'video' | 'audio';

export interface IPromptDocument extends Document {
  user: Types.ObjectId;
  title: string;
  description?: string;
  promptText: string;
  sampleOutput: string;
  mediaType: MediaType;
  aiModel: string;
  tags: string[];
  likes: Types.ObjectId[];
  views: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

