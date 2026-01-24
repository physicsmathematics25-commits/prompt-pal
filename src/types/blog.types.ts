import { Document, Types } from 'mongoose';
import { ModerationReason } from './moderation.types.js';

export type BlogStatus = 'draft' | 'published' | 'hidden';
export type BlogCategory =
  | 'MODELS'
  | 'RESEARCH'
  | 'TECHNIQUES'
  | 'TUTORIALS'
  | 'NEWS'
  | 'CASE_STUDIES';

export interface IPromptSnippet {
  title: string;
  icon?: string;
  optimizedFor: string[];
  systemInstruction?: string;
  constraints?: string[];
  examples?: string[];
  additionalContent?: Record<string, any>;
  assets: number;
  isSecurityVerified: boolean;
  studioLink?: string;
  fullPromptText: string;
}

export interface IBlogSectionImage {
  url: string;
  caption: string;
  alt: string;
}

export interface IBlogSection {
  _id?: Types.ObjectId;
  sectionNumber: number;
  title: string;
  content: string;
  promptSnippet?: IPromptSnippet;
  image?: IBlogSectionImage;
  order: number;
}

export interface IBlogPost {
  title: string;
  slug: string;
  author: Types.ObjectId;
  authorRole?: string;
  coverImage: string;
  openingQuote: string;
  sections: IBlogSection[];
  category: BlogCategory;
  tags: string[];
  publishDate: Date;
  readingTime: number;
  likes: Types.ObjectId[];
  views: number;
  shares: number;
  upNext?: Types.ObjectId;
  status: BlogStatus;
  isPublic: boolean;
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

export interface IBlogDocument extends IBlogPost, Document {
  _id: Types.ObjectId;
}

// DTOs for API responses
export interface BlogListResponse {
  _id: string;
  title: string;
  slug: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  authorRole?: string;
  coverImage: string;
  openingQuote: string;
  category: BlogCategory;
  tags: string[];
  publishDate: Date;
  readingTime: number;
  likes: number;
  views: number;
  shares: number;
  createdAt: Date;
}

export interface BlogDetailResponse extends BlogListResponse {
  sections: IBlogSection[];
  upNext?: {
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
    category: BlogCategory;
  };
  isLikedByUser?: boolean;
}

// Query interfaces
export interface BlogQueryParams {
  page?: number;
  limit?: number;
  category?: BlogCategory;
  tags?: string;
  author?: string;
  search?: string;
  sort?: 'latest' | 'popular' | 'trending';
  status?: BlogStatus;
}

export interface CreateBlogDTO {
  title: string;
  openingQuote: string;
  coverImage: string;
  category: BlogCategory;
  tags?: string[];
  sections: IBlogSection[];
  status?: BlogStatus;
  upNext?: string;
  authorRole?: string;
}

export interface UpdateBlogDTO {
  title?: string;
  openingQuote?: string;
  coverImage?: string;
  category?: BlogCategory;
  tags?: string[];
  sections?: IBlogSection[];
  status?: BlogStatus;
  upNext?: string;
  authorRole?: string;
}

export interface AddSectionDTO {
  sectionNumber: number;
  title: string;
  content: string;
  promptSnippet?: IPromptSnippet;
  image?: IBlogSectionImage;
  order: number;
}

export interface UpdateSectionDTO {
  sectionNumber?: number;
  title?: string;
  content?: string;
  promptSnippet?: IPromptSnippet;
  image?: IBlogSectionImage;
  order?: number;
}

