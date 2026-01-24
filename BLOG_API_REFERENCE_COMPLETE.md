# Blog API - Complete Reference Guide 📚

## Quick Navigation
- [Core CRUD](#core-crud-operations)
- [Section Management](#section-management)
- [Image Uploads](#image-uploads)
- [Engagement](#engagement-features)
- [Comments](#comments-system)
- [Discovery](#discovery--analytics)
- [Moderation](#moderation-admin)

---

## Core CRUD Operations

### Create Blog Post
```http
POST /api/v1/blogs
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Chain-of-Thought Prompting Explained",
  "authorRole": "AI Research Engineer",
  "coverImage": "https://cloudinary.com/...",
  "category": "TECHNIQUES",
  "tags": ["cot", "reasoning", "prompting"],
  "openingQuote": "Why 'Chain-of-Thought' isn't just a buzzword anymore",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Introduction",
      "content": "Detailed markdown content...",
      "promptSnippet": {
        "title": "Basic CoT Example",
        "optimizedFor": ["GPT-4", "Claude"],
        "systemInstruction": "Think step by step...",
        "constraints": ["Be explicit", "Show reasoning"],
        "examples": ["Q: What is 2+2? A: Let me think..."],
        "fullPromptText": "Complete prompt text here"
      },
      "image": {
        "url": "https://cloudinary.com/...",
        "caption": "CoT diagram",
        "alt": "Chain of thought visualization"
      }
    }
  ],
  "status": "published",
  "isPublic": true,
  "upNext": "65abc123..."
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "blog": {
      "_id": "65abc...",
      "title": "...",
      "slug": "chain-of-thought-prompting-explained",
      "readingTime": 8,
      "publishDate": "2026-01-24T..."
    }
  }
}
```

---

### Get Blog Feed
```http
GET /api/v1/blogs?page=1&limit=20&category=TECHNIQUES&tag=cot&search=prompting
Authorization: Optional
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` - Filter by category
- `tag` - Filter by tag
- `search` - Full-text search
- `authorId` - Filter by author

**Response:** `200 OK`
```json
{
  "status": "success",
  "results": 15,
  "data": {
    "blogs": [...],
    "pagination": {
      "total": 48,
      "page": 1,
      "totalPages": 3,
      "limit": 20
    }
  }
}
```

---

### Get Single Blog
```http
GET /api/v1/blogs/:id
Authorization: Optional (required for drafts/hidden)
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "blog": {
      "_id": "...",
      "title": "...",
      "slug": "...",
      "author": {
        "firstName": "John",
        "lastName": "Doe",
        "profileImage": "..."
      },
      "sections": [...],
      "likesCount": 234,
      "isLikedByUser": false,
      "isBookmarkedByUser": false,
      "upNext": {...}
    }
  }
}
```

---

### Get Blog by Slug
```http
GET /api/v1/blogs/slug/:slug
Authorization: Optional
```

**Note:** Increments view count with IP-based throttling (24h)

---

### Update Blog
```http
PATCH /api/v1/blogs/:id
Authorization: Required (author or admin)
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "status": "published",
  "isHidden": false,
  "sections": [...]
}
```

---

### Delete Blog
```http
DELETE /api/v1/blogs/:id
Authorization: Required (admin/superadmin only)
```

**Note:** Soft delete (sets `isDeleted: true`)

---

## Section Management

### Add Section
```http
POST /api/v1/blogs/:blogId/sections
Authorization: Required (author)
Content-Type: application/json
```

**Request Body:**
```json
{
  "sectionNumber": 3,
  "title": "Advanced Techniques",
  "content": "Detailed content...",
  "promptSnippet": {...},
  "image": {...}
}
```

---

### Update Section
```http
PATCH /api/v1/blogs/:blogId/sections/:sectionId
Authorization: Required (author)
```

---

### Delete Section
```http
DELETE /api/v1/blogs/:blogId/sections/:sectionId
Authorization: Required (author)
```

---

### Reorder Sections
```http
PATCH /api/v1/blogs/:blogId/sections/reorder
Authorization: Required (author)
Content-Type: application/json
```

**Request Body:**
```json
{
  "sectionIds": ["section1_id", "section3_id", "section2_id"]
}
```

**Note:** All section IDs must be provided in the desired order

---

## Image Uploads

### Upload Cover Image
```http
POST /api/v1/blogs/upload/cover
Authorization: Required
Content-Type: multipart/form-data
```

**Form Data:**
- `coverImage` (file) - Max 10MB, JPG/PNG/WEBP

**Response:**
```json
{
  "status": "success",
  "data": {
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

**Transformations:** 1920x1080, quality: auto

---

### Upload Section Image
```http
POST /api/v1/blogs/upload/section
Authorization: Required
Content-Type: multipart/form-data
```

**Form Data:**
- `sectionImage` (file) - Max 5MB, JPG/PNG/WEBP/GIF

**Transformations:** 1200x800, quality: auto

---

## Engagement Features

### Like/Unlike Blog
```http
POST /api/v1/blogs/:id/like
Authorization: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "blog": {
      "likesCount": 235,
      "isLiked": true
    }
  }
}
```

---

### Share Blog
```http
POST /api/v1/blogs/:id/share
Authorization: Optional
```

**Note:** Increments share counter

---

### Bookmark Blog
```http
POST /api/v1/blogs/:blogId/bookmark
Authorization: Required
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "isBookmarked": true
  }
}
```

---

### Get Bookmarked Blogs
```http
GET /api/v1/blogs/bookmarks?page=1&limit=10
Authorization: Required
```

---

### Get Liked Blogs
```http
GET /api/v1/blogs/liked?page=1&limit=10
Authorization: Required
```

---

## Comments System

### Create Comment
```http
POST /api/v1/blogs/:blogId/comments
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Great explanation of CoT!"
}
```

**Response:** `201 Created`

---

### Get Comments
```http
GET /api/v1/blogs/:blogId/comments?page=1&limit=20
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "_id": "...",
        "user": {
          "firstName": "Jane",
          "lastName": "Smith",
          "profileImage": "..."
        },
        "text": "Great article!",
        "likes": [],
        "createdAt": "..."
      }
    ],
    "pagination": {...}
  }
}
```

---

### Update Comment
```http
PATCH /api/v1/blogs/:blogId/comments/:commentId
Authorization: Required (author or admin)
```

---

### Delete Comment
```http
DELETE /api/v1/blogs/:blogId/comments/:commentId
Authorization: Required (author or admin)
```

---

### Like Comment
```http
POST /api/v1/blogs/:blogId/comments/:commentId/like
Authorization: Required
```

---

### Flag Comment
```http
POST /api/v1/blogs/:blogId/comments/:commentId/flag
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "spam",
  "details": "Promotional content"
}
```

---

## Discovery & Analytics

### Get Tag Cloud
```http
GET /api/v1/blogs/tags/cloud?limit=50
```

**Response:**
```json
{
  "status": "success",
  "results": 25,
  "data": {
    "tags": [
      {
        "tag": "prompt-engineering",
        "count": 45,
        "blogCount": 45
      }
    ]
  }
}
```

---

### Get Trending Tags
```http
GET /api/v1/blogs/tags/trending?days=7&limit=20
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "tags": [
      {
        "tag": "chain-of-thought",
        "count": 12,
        "totalViews": 5420,
        "totalLikes": 234,
        "totalShares": 89,
        "trendScore": 7103
      }
    ]
  }
}
```

**Trend Score:** `(count × 10) + (views × 1) + (likes × 3) + (shares × 5)`

---

### Get Categories
```http
GET /api/v1/blogs/categories
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "category": "TECHNIQUES",
        "name": "Techniques",
        "description": "...",
        "icon": "⚡",
        "color": "#F59E0B",
        "count": 48,
        "totalViews": 12500,
        "avgReadingTime": 8
      }
    ]
  }
}
```

---

### Get Blog Statistics
```http
GET /api/v1/blogs/stats
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "general": {
      "totalBlogs": 150,
      "publishedBlogs": 120,
      "draftBlogs": 30,
      "totalViews": 45000,
      "totalLikes": 3200,
      "totalShares": 890,
      "avgReadingTime": 7.5
    },
    "byCategory": [...]
  }
}
```

---

### Get Popular Blogs
```http
GET /api/v1/blogs/popular?metric=views&limit=10&days=30
```

**Query Parameters:**
- `metric` - `views`, `likes`, or `shares` (default: views)
- `limit` - Max results (default: 10)
- `days` - Time window (optional, omit for all-time)

---

### Get Trending Blogs
```http
GET /api/v1/blogs/trending?page=1&limit=10
```

**Algorithm:** Combines views, likes, shares, and recency with weighted scoring

---

### Get Related Blogs
```http
GET /api/v1/blogs/:id/related?limit=5
```

**Matching:** Based on shared tags and category

---

### Get Blogs by Author
```http
GET /api/v1/blogs/author/:authorId?page=1&limit=10
```

---

## Moderation (Admin)

### Flag Blog
```http
POST /api/v1/blogs/:id/flag
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "inappropriate",
  "details": "Contains offensive content"
}
```

---

### Hide/Show Blog
```http
PATCH /api/v1/blogs/:id
Authorization: Required (admin)
```

**Request Body:**
```json
{
  "isHidden": true,
  "moderationReason": "spam",
  "moderationNotes": "Duplicate content"
}
```

---

## Categories Reference

| Code | Name | Icon | Color | Description |
|------|------|------|-------|-------------|
| MODELS | AI Models | 🤖 | #3B82F6 | Latest AI model releases |
| RESEARCH | Research | 🔬 | #8B5CF6 | Academic research |
| TECHNIQUES | Techniques | ⚡ | #F59E0B | Prompt engineering |
| TUTORIALS | Tutorials | 📚 | #10B981 | How-to guides |
| NEWS | News | 📰 | #EF4444 | AI news updates |
| CASE_STUDIES | Case Studies | 💼 | #6366F1 | Real-world applications |

---

## Error Responses

All endpoints follow standard error format:

```json
{
  "status": "fail",
  "message": "Error description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

- **View counts:** 1 per IP per blog per 24h
- **API calls:** Standard rate limits apply (check headers)

---

## Pagination

All paginated endpoints return:

```json
{
  "pagination": {
    "total": 150,
    "page": 2,
    "totalPages": 8,
    "limit": 20
  }
}
```

---

## Authentication

**Methods:**
- Cookie-based (cookieAuth)
- JWT in `Authorization` header

**Optional Auth:** Some endpoints work without auth but provide enhanced data when authenticated (e.g., `isLikedByUser`, `isBookmarkedByUser`)

---

## Frontend Integration Examples

### Fetch and Display Blog
```javascript
const response = await fetch(`/api/v1/blogs/slug/${slug}`, {
  credentials: 'include' // Include cookies
});
const { data } = await response.json();
renderBlog(data.blog);
```

### Like Blog
```javascript
const response = await fetch(`/api/v1/blogs/${blogId}/like`, {
  method: 'POST',
  credentials: 'include'
});
const { data } = await response.json();
updateLikeButton(data.blog.isLiked, data.blog.likesCount);
```

### Upload Cover Image
```javascript
const formData = new FormData();
formData.append('coverImage', file);

const response = await fetch('/api/v1/blogs/upload/cover', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});
const { data } = await response.json();
setCoverImageUrl(data.imageUrl);
```

### Search and Filter
```javascript
const params = new URLSearchParams({
  page: 1,
  limit: 20,
  category: 'TECHNIQUES',
  tag: 'cot',
  search: 'prompting'
});

const response = await fetch(`/api/v1/blogs?${params}`);
const { data } = await response.json();
renderBlogList(data.blogs);
```

---

## Swagger Documentation

Full interactive API documentation available at:
```
http://localhost:8000/api-docs
```

---

## Support

For issues or questions:
- Check error messages (they're descriptive!)
- Review validation requirements
- Ensure authentication is provided where required
- Verify request body structure matches schemas

---

**Complete API Reference - Version 1.0 🚀**

