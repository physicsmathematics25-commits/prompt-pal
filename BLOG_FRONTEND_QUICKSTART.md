# Blog Feature - Frontend Integration Quick Start 🚀

## Getting Started in 5 Minutes

This guide helps frontend developers get up and running with the blog API immediately.

---

## 📍 Base URL

```
Development: http://localhost:8000/api/v1/blogs
Production: https://your-api.com/api/v1/blogs
```

---

## 🔑 Authentication

Most endpoints work without authentication, but provide enhanced data when authenticated:

```javascript
// Include credentials in all requests for automatic cookie-based auth
const response = await fetch('/api/v1/blogs', {
  credentials: 'include'
});
```

---

## 🎯 Most Common Use Cases

### 1. Display Blog Feed (Homepage)

```javascript
async function getBlogFeed(page = 1, limit = 20) {
  const response = await fetch(
    `/api/v1/blogs?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  const data = await response.json();
  return data;
}

// Response:
{
  "status": "success",
  "results": 20,
  "data": {
    "blogs": [
      {
        "_id": "...",
        "title": "Chain-of-Thought Prompting",
        "slug": "chain-of-thought-prompting",
        "coverImage": "https://...",
        "category": "TECHNIQUES",
        "tags": ["cot", "reasoning"],
        "openingQuote": "Why 'Chain-of-Thought'...",
        "readingTime": 8,
        "publishDate": "2026-01-24T...",
        "views": 1250,
        "likesCount": 89,
        "shares": 23,
        "author": {
          "firstName": "John",
          "lastName": "Doe",
          "profileImage": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "totalPages": 8,
      "limit": 20
    }
  }
}
```

### 2. Display Single Blog Post

```javascript
async function getBlogBySlug(slug) {
  const response = await fetch(
    `/api/v1/blogs/slug/${slug}`,
    { credentials: 'include' }
  );
  const data = await response.json();
  return data.data.blog;
}

// Response includes:
// - Full blog content
// - All sections with prompt snippets and images
// - isLikedByUser, isBookmarkedByUser (if authenticated)
// - Related "upNext" blog
// - Full author details
```

### 3. Like/Unlike a Blog

```javascript
async function toggleLike(blogId) {
  const response = await fetch(
    `/api/v1/blogs/${blogId}/like`,
    {
      method: 'POST',
      credentials: 'include'
    }
  );
  const data = await response.json();
  return data.data.blog; // { likesCount: 90, isLiked: true }
}
```

### 4. Bookmark a Blog

```javascript
async function toggleBookmark(blogId) {
  const response = await fetch(
    `/api/v1/blogs/${blogId}/bookmark`,
    {
      method: 'POST',
      credentials: 'include'
    }
  );
  const data = await response.json();
  return data.data; // { isBookmarked: true }
}
```

### 5. Filter by Category

```javascript
async function getBlogsByCategory(category, page = 1) {
  const response = await fetch(
    `/api/v1/blogs?category=${category}&page=${page}`,
    { credentials: 'include' }
  );
  const data = await response.json();
  return data;
}

// Available categories:
// 'MODELS', 'RESEARCH', 'TECHNIQUES', 'TUTORIALS', 'NEWS', 'CASE_STUDIES'
```

### 6. Search Blogs

```javascript
async function searchBlogs(query, page = 1) {
  const response = await fetch(
    `/api/v1/blogs?search=${encodeURIComponent(query)}&page=${page}`,
    { credentials: 'include' }
  );
  const data = await response.json();
  return data;
}
```

### 7. Get Trending Tags

```javascript
async function getTrendingTags(limit = 10) {
  const response = await fetch(
    `/api/v1/blogs/tags/trending?limit=${limit}`
  );
  const data = await response.json();
  return data.data.tags;
}

// Response:
[
  {
    "tag": "chain-of-thought",
    "count": 12,
    "totalViews": 5420,
    "totalLikes": 234,
    "totalShares": 89,
    "trendScore": 7103
  }
]
```

### 8. Get Categories with Metadata

```javascript
async function getCategories() {
  const response = await fetch('/api/v1/blogs/categories');
  const data = await response.json();
  return data.data.categories;
}

// Response includes icon, color, description, and stats for each category
```

---

## 🎨 Example React Components

### Blog Card Component

```jsx
function BlogCard({ blog }) {
  return (
    <div className="blog-card">
      <img src={blog.coverImage} alt={blog.title} />
      
      <div className="category-badge" style={{ borderColor: getCategoryColor(blog.category) }}>
        {blog.category}
      </div>
      
      <h3>
        <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link>
      </h3>
      
      <p className="quote">{blog.openingQuote}</p>
      
      <div className="meta">
        <img src={blog.author.profileImage} alt={blog.author.firstName} />
        <span>{blog.author.firstName} {blog.author.lastName}</span>
        <span>·</span>
        <span>{blog.readingTime} min read</span>
      </div>
      
      <div className="engagement">
        <span>👁️ {blog.views.toLocaleString()}</span>
        <span>❤️ {blog.likesCount}</span>
        <span>🔗 {blog.shares}</span>
      </div>
      
      <div className="tags">
        {blog.tags.map(tag => (
          <Link key={tag} to={`/blogs?tag=${tag}`} className="tag">
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Like Button Component

```jsx
function LikeButton({ blogId, initialLiked, initialCount }) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/v1/blogs/${blogId}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      setIsLiked(data.data.blog.isLiked);
      setCount(data.data.blog.likesCount);
    } catch (error) {
      console.error('Failed to like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`like-button ${isLiked ? 'liked' : ''}`}
      disabled={loading}
    >
      {isLiked ? '❤️' : '🤍'} {count}
    </button>
  );
}
```

### Blog Detail Page

```jsx
function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      try {
        const response = await fetch(`/api/v1/blogs/slug/${slug}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setBlog(data.data.blog);
      } catch (error) {
        console.error('Failed to fetch blog:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlog();
  }, [slug]);

  if (loading) return <Loader />;
  if (!blog) return <NotFound />;

  return (
    <article className="blog-detail">
      <header>
        <img src={blog.coverImage} alt={blog.title} className="cover-image" />
        <div className="header-content">
          <span className="category">{blog.category}</span>
          <h1>{blog.title}</h1>
          <blockquote className="opening-quote">{blog.openingQuote}</blockquote>
          
          <div className="meta">
            <Author author={blog.author} role={blog.authorRole} />
            <span>·</span>
            <time>{new Date(blog.publishDate).toLocaleDateString()}</time>
            <span>·</span>
            <span>{blog.readingTime} min read</span>
          </div>
          
          <div className="actions">
            <LikeButton
              blogId={blog._id}
              initialLiked={blog.isLikedByUser}
              initialCount={blog.likesCount}
            />
            <BookmarkButton
              blogId={blog._id}
              initialBookmarked={blog.isBookmarkedByUser}
            />
            <ShareButton blogId={blog._id} />
          </div>
        </div>
      </header>

      <div className="content">
        {blog.sections.map((section, index) => (
          <section key={section._id} className="blog-section">
            <h2>{section.sectionNumber}. {section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: marked(section.content) }} />
            
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
      </div>

      {blog.upNext && (
        <aside className="up-next">
          <h3>Up Next</h3>
          <BlogCard blog={blog.upNext} />
        </aside>
      )}

      <Comments blogId={blog._id} />
    </article>
  );
}
```

### Trending Tags Widget

```jsx
function TrendingTags() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    async function fetchTags() {
      const response = await fetch('/api/v1/blogs/tags/trending?limit=10');
      const data = await response.json();
      setTags(data.data.tags);
    }
    fetchTags();
  }, []);

  return (
    <div className="trending-tags">
      <h3>🔥 Trending Tags</h3>
      <div className="tags-list">
        {tags.map(tag => (
          <Link
            key={tag.tag}
            to={`/blogs?tag=${tag.tag}`}
            className="trending-tag"
          >
            #{tag.tag}
            <span className="count">{tag.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 📦 API Response Helpers

```javascript
// Generic API fetch helper
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`/api/v1${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Usage:
const blogs = await apiFetch('/blogs?page=1&limit=20');
const blog = await apiFetch('/blogs/slug/my-blog');
const liked = await apiFetch('/blogs/123/like', { method: 'POST' });
```

---

## 🎨 Category Color Mapping

```javascript
const CATEGORY_COLORS = {
  MODELS: '#3B82F6',
  RESEARCH: '#8B5CF6',
  TECHNIQUES: '#F59E0B',
  TUTORIALS: '#10B981',
  NEWS: '#EF4444',
  CASE_STUDIES: '#6366F1',
};

const CATEGORY_ICONS = {
  MODELS: '🤖',
  RESEARCH: '🔬',
  TECHNIQUES: '⚡',
  TUTORIALS: '📚',
  NEWS: '📰',
  CASE_STUDIES: '💼',
};

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#6B7280';
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📄';
}
```

---

## 🔍 Search & Filter Combination

```javascript
// Build complex queries
function buildBlogQuery({ page = 1, limit = 20, category, tag, search, authorId }) {
  const params = new URLSearchParams();
  
  params.append('page', page);
  params.append('limit', limit);
  
  if (category) params.append('category', category);
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);
  if (authorId) params.append('authorId', authorId);
  
  return `/api/v1/blogs?${params.toString()}`;
}

// Usage:
const url = buildBlogQuery({
  page: 1,
  category: 'TECHNIQUES',
  tag: 'cot',
  search: 'prompting'
});

const response = await fetch(url, { credentials: 'include' });
```

---

## 💬 Comments Integration

```javascript
// Get comments
async function getComments(blogId, page = 1) {
  const response = await fetch(
    `/api/v1/blogs/${blogId}/comments?page=${page}&limit=20`
  );
  return await response.json();
}

// Create comment
async function createComment(blogId, text) {
  const response = await fetch(
    `/api/v1/blogs/${blogId}/comments`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }
  );
  return await response.json();
}

// Like comment
async function likeComment(blogId, commentId) {
  const response = await fetch(
    `/api/v1/blogs/${blogId}/comments/${commentId}/like`,
    {
      method: 'POST',
      credentials: 'include'
    }
  );
  return await response.json();
}
```

---

## 📊 Analytics & Discovery

```javascript
// Get platform statistics
async function getStats() {
  const response = await fetch('/api/v1/blogs/stats');
  const data = await response.json();
  return data.data; // { general: {...}, byCategory: [...] }
}

// Get popular blogs
async function getPopularBlogs(metric = 'views', days = 30, limit = 10) {
  const response = await fetch(
    `/api/v1/blogs/popular?metric=${metric}&days=${days}&limit=${limit}`
  );
  const data = await response.json();
  return data.data.blogs;
}

// Get tag cloud
async function getTagCloud(limit = 50) {
  const response = await fetch(`/api/v1/blogs/tags/cloud?limit=${limit}`);
  const data = await response.json();
  return data.data.tags;
}
```

---

## 🖼️ Image Upload (for Blog Creation)

```javascript
async function uploadCoverImage(file) {
  const formData = new FormData();
  formData.append('coverImage', file);

  const response = await fetch('/api/v1/blogs/upload/cover', {
    method: 'POST',
    credentials: 'include',
    body: formData, // Don't set Content-Type header
  });

  const data = await response.json();
  return data.data.imageUrl; // Cloudinary URL
}

async function uploadSectionImage(file) {
  const formData = new FormData();
  formData.append('sectionImage', file);

  const response = await fetch('/api/v1/blogs/upload/section', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json();
  return data.data.imageUrl;
}
```

---

## 📝 Create Blog Post (Author)

```javascript
async function createBlog(blogData) {
  const response = await fetch('/api/v1/blogs', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: blogData.title,
      authorRole: blogData.authorRole,
      coverImage: blogData.coverImage, // From uploadCoverImage()
      category: blogData.category,
      tags: blogData.tags,
      openingQuote: blogData.openingQuote,
      sections: blogData.sections,
      status: 'published', // or 'draft'
      isPublic: true,
    })
  });

  const data = await response.json();
  return data.data.blog;
}

// Example section structure:
const section = {
  sectionNumber: 1,
  title: "Introduction",
  content: "Markdown content here...",
  promptSnippet: { // Optional
    title: "Example Prompt",
    optimizedFor: ["GPT-4"],
    fullPromptText: "Complete prompt...",
    // ... other fields
  },
  image: { // Optional
    url: "https://cloudinary.com/...",
    caption: "Diagram showing...",
    alt: "Descriptive alt text"
  }
};
```

---

## 🎯 Quick Start Checklist

- [ ] Set up API base URL configuration
- [ ] Implement authentication (cookie-based)
- [ ] Create `apiFetch` helper function
- [ ] Build `BlogCard` component
- [ ] Build `BlogDetailPage` component
- [ ] Implement like/bookmark buttons
- [ ] Add category filtering
- [ ] Add search functionality
- [ ] Display trending tags
- [ ] Add comments section
- [ ] Handle loading & error states
- [ ] Add pagination
- [ ] Test with Swagger UI first: `http://localhost:8000/api-docs`

---

## 🔗 Useful Links

- **API Docs (Swagger):** `http://localhost:8000/api-docs`
- **Complete API Reference:** `BLOG_API_REFERENCE_COMPLETE.md`
- **Phase Documentation:** `BLOG_PHASE1_COMPLETE.md` through `BLOG_PHASE4_COMPLETE.md`

---

## 🆘 Common Issues

### Issue: Not authenticated
**Solution:** Ensure `credentials: 'include'` is in all fetch calls

### Issue: CORS errors
**Solution:** Backend already configured for CORS, check your origin

### Issue: Images not uploading
**Solution:** Check file size (10MB cover, 5MB section) and format (JPG/PNG/WEBP)

### Issue: isLikedByUser always false
**Solution:** User must be authenticated for this field to populate

---

## 🎉 You're Ready!

Start with the homepage blog feed, then build out individual blog pages. The API is fully functional and ready for integration.

**Happy coding! 🚀**

