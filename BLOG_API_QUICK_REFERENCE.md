# Blog API Quick Reference Guide

## 🚀 Complete API Endpoints (17 Total)

### 📝 Blog CRUD

```bash
# List all blogs (with filters)
GET /api/v1/blogs?page=1&limit=10&category=TECHNIQUES&sort=trending&search=prompt
# Public access, optional auth for drafts

# Create blog
POST /api/v1/blogs
Authorization: Bearer <token>
Content-Type: application/json
# Body: { title, openingQuote, coverImage, category, tags, sections, status, authorRole }

# Get by slug (increments view count)
GET /api/v1/blogs/slug/:slug
# Optional auth

# Get by ID
GET /api/v1/blogs/:id
# Optional auth

# Update blog
PATCH /api/v1/blogs/:id
Authorization: Bearer <token>
# Body: Partial blog data

# Delete blog (soft delete)
DELETE /api/v1/blogs/:id
Authorization: Bearer <token>
```

### 🔧 Section Management

```bash
# Add section
POST /api/v1/blogs/:id/sections
Authorization: Bearer <token>
# Body: { sectionNumber, title, content, order, promptSnippet?, image? }

# Update section
PATCH /api/v1/blogs/:id/sections/:sectionId
Authorization: Bearer <token>
# Body: Partial section data

# Delete section
DELETE /api/v1/blogs/:id/sections/:sectionId
Authorization: Bearer <token>

# Reorder sections
PATCH /api/v1/blogs/:id/sections/reorder
Authorization: Bearer <token>
# Body: { sectionIds: ["id1", "id2", "id3"] }
```

### 📷 Image Uploads

```bash
# Upload cover image (10MB max, 1920x1080)
POST /api/v1/blogs/upload/cover
Authorization: Bearer <token>
Content-Type: multipart/form-data
# Form data: image=<binary>

# Upload section image (5MB max, 1200x800)
POST /api/v1/blogs/upload/section
Authorization: Bearer <token>
Content-Type: multipart/form-data
# Form data: image=<binary>
```

### 💝 Engagement

```bash
# Toggle like
POST /api/v1/blogs/:id/like
Authorization: Bearer <token>

# Increment share count
POST /api/v1/blogs/:id/share
# No auth required
```

### 🔍 Discovery

```bash
# Get related blogs
GET /api/v1/blogs/:id/related?limit=3

# Get blogs by author
GET /api/v1/blogs/author/:authorId?page=1&limit=10
# Optional auth to see author's drafts
```

### 📋 Content

```bash
# Get prompt snippet (for copy button)
GET /api/v1/blogs/:id/sections/:sectionId/prompt
```

---

## 📊 Request/Response Examples

### Create Blog with All Features

**Request:**
```http
POST /api/v1/blogs HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "The Emergence of Reasoning Models: A Deep Dive into OpenAI o1",
  "openingQuote": "Why 'Chain-of-Thought' isn't just a buzzword anymore, but the new standard for complex problem solving in LLMs.",
  "coverImage": "https://res.cloudinary.com/example/image/upload/v.../blog-cover-123.jpg",
  "category": "MODELS",
  "tags": ["reasoning", "openai", "chain-of-thought"],
  "authorRole": "LEAD MODEL ARCHITECT",
  "status": "published",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "The Shift Toward Latent Reasoning",
      "content": "Current breakthroughs in large language models aren't just about parameter count anymore. We're seeing a fundamental pivot toward 'Inference-time Compute.'",
      "order": 0
    },
    {
      "sectionNumber": 2,
      "title": "Structural Integrity in Prompt Engineering",
      "content": "A common mistake made by new architects is the 'Lump Sum' approach—dumping all instructions into one long paragraph.",
      "promptSnippet": {
        "title": "The 'Reasoning Anchor' Prompt",
        "icon": ">_",
        "optimizedFor": ["GPT-4", "Claude 3.5"],
        "systemInstruction": "Act as a reasoning agent. Before answering, create a [CHAIN_OF_THOUGHT] section where you break down the logic into atomic steps.",
        "constraints": [
          "Do not output the reasoning section to the user.",
          "Focus on edge cases first.",
          "Ensure the final output is in structured JSON format."
        ],
        "examples": [],
        "assets": 4,
        "isSecurityVerified": true,
        "fullPromptText": "# SYSTEM INSTRUCTION\nAct as a reasoning agent. Before answering, create a [CHAIN_OF_THOUGHT] section where you break down the logic into atomic steps.\n\n# CONSTRAINTS\n- Do not output the reasoning section to the user.\n- Focus on edge cases first.\n- Ensure the final output is in structured JSON format."
      },
      "order": 1
    },
    {
      "sectionNumber": 3,
      "title": "Closing Thoughts",
      "content": "As we move into 2025, the prompt engineer's role is evolving into a 'Prompt Architect.'",
      "image": {
        "url": "https://res.cloudinary.com/example/image/upload/v.../section-img-456.jpg",
        "caption": "VISUALIZING TRANSFORMER ATTENTION - Heatmaps reveal that structured prompts lead to 40% higher keyword retention.",
        "alt": "Transformer attention heatmap visualization"
      },
      "order": 2
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "blog": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Emergence of Reasoning Models: A Deep Dive into OpenAI o1",
      "slug": "the-emergence-of-reasoning-models-a-deep-dive-into-openai-o1",
      "author": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Aris",
        "lastName": "Thorne",
        "profileImage": "https://...",
        "email": "aris@example.com"
      },
      "authorRole": "LEAD MODEL ARCHITECT",
      "coverImage": "https://res.cloudinary.com/.../blog-cover-123.jpg",
      "openingQuote": "Why 'Chain-of-Thought' isn't just a buzzword anymore...",
      "category": "MODELS",
      "tags": ["reasoning", "openai", "chain-of-thought"],
      "readingTime": 8,
      "publishDate": "2026-01-24T12:00:00.000Z",
      "sections": [...],
      "likes": [],
      "views": 0,
      "shares": 0,
      "status": "published",
      "isPublic": true,
      "isHidden": false,
      "isDeleted": false,
      "flaggedCount": 0,
      "createdAt": "2026-01-24T12:00:00.000Z",
      "updatedAt": "2026-01-24T12:00:00.000Z"
    }
  }
}
```

### Get Blogs with Filtering

**Request:**
```http
GET /api/v1/blogs?page=1&limit=10&category=TECHNIQUES&tags=prompting,ai&sort=trending&search=chain-of-thought HTTP/1.1
```

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "blogs": [
      {
        "_id": "...",
        "title": "...",
        "slug": "...",
        "author": {...},
        "coverImage": "...",
        "category": "TECHNIQUES",
        "tags": ["prompting", "ai"],
        "readingTime": 8,
        "publishDate": "...",
        "likesCount": 142,
        "commentCount": 23,
        "sharesCount": 56,
        "views": 1234
      },
      ...
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "totalPages": 5,
      "limit": 10
    }
  }
}
```

### Upload Cover Image

**Request:**
```http
POST /api/v1/blogs/upload/cover HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="image"; filename="cover.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "imageUrl": "https://res.cloudinary.com/dxhkryxzk/image/upload/v1737720000/prompt-pal/blogs/covers/user123/blog-cover-1737720000-123456789.jpg"
  }
}
```

### Reorder Sections

**Request:**
```http
PATCH /api/v1/blogs/507f1f77bcf86cd799439011/sections/reorder HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "sectionIds": [
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014"
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "blog": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "...",
      "sections": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "sectionNumber": 1,
          "order": 0,
          ...
        },
        {
          "_id": "507f1f77bcf86cd799439013",
          "sectionNumber": 2,
          "order": 1,
          ...
        },
        {
          "_id": "507f1f77bcf86cd799439014",
          "sectionNumber": 3,
          "order": 2,
          ...
        }
      ],
      ...
    }
  }
}
```

---

## 🎯 Query Parameters Reference

### GET /api/v1/blogs

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Items per page (max 50) |
| `category` | enum | - | Filter by category: `MODELS`, `RESEARCH`, `TECHNIQUES`, `TUTORIALS`, `NEWS`, `CASE_STUDIES` |
| `tags` | string | - | Comma-separated tags: `ai,prompting,gpt4` |
| `author` | string | - | Filter by author user ID |
| `search` | string | - | Text search in title, content, tags |
| `sort` | enum | `latest` | Sort order: `latest`, `popular`, `trending` |
| `status` | enum | - | Filter by status (admin/author only): `draft`, `published`, `hidden` |

**Examples:**
```
/api/v1/blogs?category=TECHNIQUES&sort=trending
/api/v1/blogs?tags=ai,gpt4&limit=20
/api/v1/blogs?search=chain-of-thought&page=2
/api/v1/blogs?author=507f1f77bcf86cd799439012
```

---

## 🔑 Authentication

Most endpoints require JWT authentication via cookie or Bearer token:

**Cookie (Preferred):**
```
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Endpoints Requiring Auth:**
- All `POST`, `PATCH`, `DELETE` operations
- Upload endpoints
- Like endpoint

**Public Endpoints:**
- `GET /api/v1/blogs` (published only)
- `GET /api/v1/blogs/slug/:slug` (published only)
- `GET /api/v1/blogs/:id/related`
- `POST /api/v1/blogs/:id/share`
- `GET /api/v1/blogs/:id/sections/:sectionId/prompt`

---

## 🎨 Frontend Integration Tips

### 1. Blog Editor Workflow

```javascript
// Step 1: Upload images first
async function uploadImages(coverFile, sectionImages) {
  const coverUrl = await uploadCover(coverFile);
  const sectionUrls = await Promise.all(
    sectionImages.map(img => uploadSectionImage(img))
  );
  return { coverUrl, sectionUrls };
}

// Step 2: Create blog with URLs
async function createBlog(blogData, imageUrls) {
  blogData.coverImage = imageUrls.coverUrl;
  blogData.sections.forEach((section, i) => {
    if (imageUrls.sectionUrls[i]) {
      section.image = {
        url: imageUrls.sectionUrls[i],
        caption: section.imageCaption,
        alt: section.imageAlt
      };
    }
  });
  
  return await fetch('/api/v1/blogs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(blogData)
  });
}
```

### 2. Blog Viewer

```javascript
// Fetch blog with view tracking
async function viewBlog(slug) {
  const response = await fetch(`/api/v1/blogs/slug/${slug}`);
  const { data: { blog } } = await response.json();
  
  // View count automatically incremented
  return blog;
}

// Display with engagement
function BlogPost({ blog }) {
  return (
    <article>
      <img src={blog.coverImage} alt={blog.title} />
      <h1>{blog.title}</h1>
      <blockquote>{blog.openingQuote}</blockquote>
      
      {blog.sections.map(section => (
        <section key={section._id}>
          <h2>{section.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
          
          {section.promptSnippet && (
            <PromptSnippet snippet={section.promptSnippet} />
          )}
          
          {section.image && (
            <figure>
              <img src={section.image.url} alt={section.image.alt} />
              <figcaption>{section.image.caption}</figcaption>
            </figure>
          )}
        </section>
      ))}
      
      <LikeButton blogId={blog._id} initialLikes={blog.likesCount} />
      <ShareButton blogId={blog._id} initialShares={blog.sharesCount} />
    </article>
  );
}
```

### 3. Prompt Snippet Copy

```javascript
async function copyPromptToClipboard(blogId, sectionId) {
  const response = await fetch(
    `/api/v1/blogs/${blogId}/sections/${sectionId}/prompt`
  );
  const { data: { fullPromptText } } = await response.json();
  
  await navigator.clipboard.writeText(fullPromptText);
  showNotification('Prompt copied to clipboard!');
}
```

### 4. Section Drag & Drop Reordering

```javascript
async function handleSectionReorder(blogId, newOrder) {
  const sectionIds = newOrder.map(section => section._id);
  
  await fetch(`/api/v1/blogs/${blogId}/sections/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ sectionIds })
  });
}
```

---

## 🛡️ Error Handling

### Common Error Responses

```json
// 400 Bad Request
{
  "status": "error",
  "message": "Invalid section IDs provided."
}

// 401 Unauthorized
{
  "status": "error",
  "message": "You must be logged in to create a blog."
}

// 403 Forbidden
{
  "status": "error",
  "message": "You do not have permission to update this blog."
}

// 404 Not Found
{
  "status": "error",
  "message": "Blog post not found."
}

// 413 Payload Too Large (Image upload)
{
  "status": "error",
  "message": "File too large. Maximum size is 10MB."
}

// 422 Validation Error
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 10 characters."
    }
  ]
}
```

---

## 📚 Complete Data Model

```typescript
BlogPost {
  _id: ObjectId
  title: string (10-200 chars)
  slug: string (unique, auto-generated)
  author: User {
    _id, firstName, lastName, email, profileImage
  }
  authorRole?: string
  coverImage: string (Cloudinary URL)
  openingQuote: string (10-500 chars)
  sections: BlogSection[] (1-20)
  category: "MODELS" | "RESEARCH" | "TECHNIQUES" | "TUTORIALS" | "NEWS" | "CASE_STUDIES"
  tags: string[] (max 10)
  publishDate: Date
  readingTime: number (auto-calculated)
  likes: ObjectId[] (User references)
  views: number
  shares: number
  upNext?: BlogPost reference
  status: "draft" | "published" | "hidden"
  isPublic: boolean
  isHidden: boolean
  isDeleted: boolean
  moderationReason?: string
  moderationNotes?: string
  flaggedCount: number
  lastFlaggedAt?: Date
  deletedAt?: Date
  deletedBy?: ObjectId
  createdAt: Date
  updatedAt: Date
}

BlogSection {
  _id: ObjectId
  sectionNumber: number
  title: string (3-200 chars)
  content: string (10-10000 chars, markdown/HTML)
  promptSnippet?: PromptSnippet
  image?: {
    url: string
    caption: string (max 300 chars)
    alt: string (max 200 chars)
  }
  order: number
}

PromptSnippet {
  title: string
  icon?: string (default ">_")
  optimizedFor: string[] (AI models)
  systemInstruction?: string
  constraints?: string[]
  examples?: string[]
  additionalContent?: Record<string, any>
  assets: number
  isSecurityVerified: boolean
  studioLink?: string
  fullPromptText: string (formatted for copy)
}
```

---

## 🧪 Testing Checklist

- [ ] Create blog with all fields
- [ ] Create blog with minimal fields
- [ ] Upload cover image (various formats/sizes)
- [ ] Upload section image
- [ ] Add section to existing blog
- [ ] Update section
- [ ] Delete section
- [ ] Reorder sections
- [ ] Like/unlike blog
- [ ] Share blog
- [ ] Get by slug (verify view increment)
- [ ] Filter by category
- [ ] Filter by tags
- [ ] Text search
- [ ] Sort by latest/popular/trending
- [ ] Get related blogs
- [ ] Get author's blogs
- [ ] Copy prompt snippet
- [ ] Update blog (author)
- [ ] Delete blog (author)
- [ ] Permission checks (non-author)
- [ ] Draft vs published visibility

---

**Last Updated**: January 24, 2026  
**API Version**: 1.0  
**Base URL**: `/api/v1`

