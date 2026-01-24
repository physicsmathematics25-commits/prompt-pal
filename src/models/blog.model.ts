/**
 * @swagger
 * components:
 *   schemas:
 *     PromptSnippet:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the prompt snippet
 *           example: The 'Reasoning Anchor' Prompt
 *         icon:
 *           type: string
 *           description: Icon identifier
 *           example: ">_"
 *         optimizedFor:
 *           type: array
 *           items:
 *             type: string
 *           description: AI models this prompt is optimized for
 *           example: ["GPT-4", "Claude 3.5"]
 *         systemInstruction:
 *           type: string
 *           description: Main system instruction
 *         constraints:
 *           type: array
 *           items:
 *             type: string
 *           description: List of constraints
 *         examples:
 *           type: array
 *           items:
 *             type: string
 *           description: Usage examples
 *         assets:
 *           type: integer
 *           description: Number of included assets
 *           example: 4
 *         isSecurityVerified:
 *           type: boolean
 *           description: Security verification status
 *           default: false
 *         fullPromptText:
 *           type: string
 *           description: Complete formatted prompt text for copying
 *
 *     BlogSection:
 *       type: object
 *       required:
 *         - sectionNumber
 *         - title
 *         - content
 *         - order
 *       properties:
 *         sectionNumber:
 *           type: integer
 *           description: Section number
 *           example: 1
 *         title:
 *           type: string
 *           description: Section title
 *           example: The Shift Toward Latent Reasoning
 *         content:
 *           type: string
 *           description: Section content (markdown/HTML)
 *         promptSnippet:
 *           $ref: '#/components/schemas/PromptSnippet'
 *         image:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             caption:
 *               type: string
 *             alt:
 *               type: string
 *         order:
 *           type: integer
 *           description: Display order
 *
 *     BlogPost:
 *       type: object
 *       required:
 *         - author
 *         - title
 *         - openingQuote
 *         - coverImage
 *         - category
 *         - sections
 *       properties:
 *         _id:
 *           type: string
 *           description: Blog post ID
 *           example: 507f1f77bcf86cd799439011
 *         title:
 *           type: string
 *           minLength: 10
 *           maxLength: 200
 *           description: Blog post title
 *           example: The Emergence of Reasoning Models
 *         slug:
 *           type: string
 *           description: URL-friendly slug (auto-generated)
 *           example: the-emergence-of-reasoning-models
 *         author:
 *           type: string
 *           description: Author user ID
 *           example: 507f1f77bcf86cd799439011
 *         authorRole:
 *           type: string
 *           description: Author's role/title
 *           example: LEAD MODEL ARCHITECT
 *         coverImage:
 *           type: string
 *           description: Cover/hero image URL
 *         openingQuote:
 *           type: string
 *           maxLength: 500
 *           description: Opening quote or summary
 *           example: Why 'Chain-of-Thought' isn't just a buzzword anymore
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BlogSection'
 *         category:
 *           type: string
 *           enum: [MODELS, RESEARCH, TECHNIQUES, TUTORIALS, NEWS, CASE_STUDIES]
 *           description: Blog category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for filtering
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *         readingTime:
 *           type: integer
 *           description: Estimated reading time in minutes
 *           example: 8
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: User IDs who liked
 *         views:
 *           type: integer
 *           default: 0
 *           description: View count
 *         shares:
 *           type: integer
 *           default: 0
 *           description: Share count
 *         upNext:
 *           type: string
 *           description: Related blog post ID
 *         status:
 *           type: string
 *           enum: [draft, published, hidden]
 *           default: draft
 *           description: Publication status
 *         isPublic:
 *           type: boolean
 *           default: true
 *         isHidden:
 *           type: boolean
 *           default: false
 *         isDeleted:
 *           type: boolean
 *           default: false
 *         flaggedCount:
 *           type: integer
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema, SchemaDefinition } from 'mongoose';
import { IBlogDocument, BlogCategory } from '../types/blog.types.js';

const promptSnippetSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Prompt snippet title is required.'],
      trim: true,
      maxlength: [200, 'Prompt snippet title cannot exceed 200 characters.'],
    },
    icon: {
      type: String,
      trim: true,
      default: '>_',
    },
    optimizedFor: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr: string[]) {
          return arr.length <= 10;
        },
        message: 'Cannot have more than 10 optimized models.',
      },
    },
    systemInstruction: {
      type: String,
      trim: true,
      maxlength: [2000, 'System instruction cannot exceed 2000 characters.'],
    },
    constraints: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr: string[]) {
          return arr.length <= 20;
        },
        message: 'Cannot have more than 20 constraints.',
      },
    },
    examples: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr: string[]) {
          return arr.length <= 10;
        },
        message: 'Cannot have more than 10 examples.',
      },
    },
    additionalContent: {
      type: Schema.Types.Mixed,
    },
    assets: {
      type: Number,
      default: 0,
      min: [0, 'Assets count cannot be negative.'],
    },
    isSecurityVerified: {
      type: Boolean,
      default: false,
    },
    studioLink: {
      type: String,
      trim: true,
    },
    fullPromptText: {
      type: String,
      required: [true, 'Full prompt text is required.'],
      trim: true,
      maxlength: [5000, 'Full prompt text cannot exceed 5000 characters.'],
    },
  },
  { _id: false },
);

const blogSectionImageSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required.'],
      trim: true,
    },
    caption: {
      type: String,
      required: [true, 'Image caption is required.'],
      trim: true,
      maxlength: [300, 'Image caption cannot exceed 300 characters.'],
    },
    alt: {
      type: String,
      required: [true, 'Image alt text is required.'],
      trim: true,
      maxlength: [200, 'Image alt text cannot exceed 200 characters.'],
    },
  },
  { _id: false },
);

const blogSectionSchema = new Schema(
  {
    sectionNumber: {
      type: Number,
      required: [true, 'Section number is required.'],
      min: [1, 'Section number must be at least 1.'],
    },
    title: {
      type: String,
      required: [true, 'Section title is required.'],
      trim: true,
      maxlength: [200, 'Section title cannot exceed 200 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Section content is required.'],
      trim: true,
      maxlength: [10000, 'Section content cannot exceed 10000 characters.'],
    },
    promptSnippet: {
      type: promptSnippetSchema,
      required: false,
    },
    image: {
      type: blogSectionImageSchema,
      required: false,
    },
    order: {
      type: Number,
      required: [true, 'Section order is required.'],
      min: [0, 'Section order cannot be negative.'],
    },
  },
  { timestamps: false },
);

const blogPostSchemaDefinition: SchemaDefinition<IBlogDocument> = {
  title: {
    type: String,
    required: [true, 'Title is required.'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters.'],
    maxlength: [200, 'Title cannot exceed 200 characters.'],
  },
  slug: {
    type: String,
    required: [true, 'Slug is required.'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required.'],
    index: true,
  },
  authorRole: {
    type: String,
    trim: true,
    maxlength: [100, 'Author role cannot exceed 100 characters.'],
  },
  coverImage: {
    type: String,
    required: [true, 'Cover image is required.'],
    trim: true,
  },
  openingQuote: {
    type: String,
    required: [true, 'Opening quote is required.'],
    trim: true,
    maxlength: [500, 'Opening quote cannot exceed 500 characters.'],
  },
  sections: {
    type: [blogSectionSchema],
    required: [true, 'At least one section is required.'],
    validate: {
      validator: function (sections: any[]) {
        return sections.length > 0 && sections.length <= 20;
      },
      message: 'Blog must have between 1 and 20 sections.',
    },
  },
  category: {
    type: String,
    enum: {
      values: [
        'MODELS',
        'RESEARCH',
        'TECHNIQUES',
        'TUTORIALS',
        'NEWS',
        'CASE_STUDIES',
      ] as BlogCategory[],
      message:
        'Category must be: MODELS, RESEARCH, TECHNIQUES, TUTORIALS, NEWS, or CASE_STUDIES',
    },
    required: [true, 'Category is required.'],
    index: true,
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
  publishDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  readingTime: {
    type: Number,
    required: [true, 'Reading time is required.'],
    min: [1, 'Reading time must be at least 1 minute.'],
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
    min: [0, 'Views cannot be negative.'],
  },
  shares: {
    type: Number,
    default: 0,
    min: [0, 'Shares cannot be negative.'],
  },
  upNext: {
    type: Schema.Types.ObjectId,
    ref: 'BlogPost',
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'hidden'],
      message: 'Status must be: draft, published, or hidden',
    },
    default: 'draft',
    index: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true,
  },
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
      values: ['spam', 'inappropriate', 'copyright', 'policy_violation', 'other'],
      message:
        'Moderation reason must be: spam, inappropriate, copyright, policy_violation, or other',
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
    min: [0, 'Flagged count cannot be negative.'],
  },
  lastFlaggedAt: {
    type: Date,
  },
};

const blogPostSchema = new Schema<IBlogDocument>(blogPostSchemaDefinition, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for efficient queries
blogPostSchema.index({ slug: 1 }); // Unique lookup
blogPostSchema.index({ author: 1, status: 1 }); // Author's posts
blogPostSchema.index({ status: 1, publishDate: -1 }); // Published posts by date
blogPostSchema.index({ category: 1, status: 1, publishDate: -1 }); // Category filtering
blogPostSchema.index({ tags: 1 }); // Tag filtering
blogPostSchema.index({ views: -1 }); // Popular posts
blogPostSchema.index({ isPublic: 1, isHidden: 1, isDeleted: 1 }); // Visibility
blogPostSchema.index({ flaggedCount: -1, lastFlaggedAt: -1 }); // Moderation

// Text search index
blogPostSchema.index({
  title: 'text',
  openingQuote: 'text',
  'sections.title': 'text',
  'sections.content': 'text',
  tags: 'text',
});

// Compound indexes for common queries
blogPostSchema.index({
  status: 1,
  isPublic: 1,
  isHidden: 1,
  isDeleted: 1,
  publishDate: -1,
});

const BlogPost = mongoose.model<IBlogDocument>('BlogPost', blogPostSchema);

export default BlogPost;

