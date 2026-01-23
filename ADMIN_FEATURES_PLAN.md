# Admin Features Implementation Plan

## 1. Overview

### 1.1 Purpose
This plan outlines the implementation of advanced admin functionalities for Prompt Pal, focusing on content moderation and analytics/dashboard capabilities. These features will enable administrators to effectively manage the platform, moderate user-generated content, and gain insights into platform health and user behavior.

### 1.2 Goals
- Enable comprehensive content moderation for prompts and comments
- Provide administrators with actionable analytics and insights
- Implement a flagged content system for community-driven moderation
- Support bulk operations for efficient content management
- Track platform growth, engagement, and optimization metrics

### 1.3 Key Features

#### Content Moderation
- **Prompt Management**: View, edit, delete, hide/unhide prompts
- **Comment Management**: View, edit, delete, hide inappropriate comments
- **Flagged Content System**: Users can report content; admins can review and take action
- **Bulk Actions**: Delete/hide multiple items at once
- **Moderation History**: Track all moderation actions with audit trail

#### Analytics & Dashboard
- **Platform Statistics**: Total users, prompts, comments, optimizations
- **Growth Metrics**: New users/prompts per day/week/month
- **Engagement Metrics**: Most liked prompts, most viewed, top users
- **Optimization Stats**: Quick vs premium usage, average quality improvements
- **User Activity**: Active users, engagement rates, user retention

---

## 2. Architecture & Design

### 2.1 Module Structure
```
src/
├── controllers/
│   ├── admin.controller.ts              # Existing - extend with new handlers
│   └── analytics.controller.ts          # New - analytics endpoints
├── services/
│   ├── admin.service.ts                 # Existing - extend with moderation logic
│   ├── moderation.service.ts            # New - content moderation business logic
│   └── analytics.service.ts             # New - analytics calculations
├── models/
│   ├── prompt.model.ts                  # Existing - add moderation fields
│   ├── comment.model.ts                 # Existing - add moderation fields
│   └── contentFlag.model.ts             # New - flagged content tracking
├── routes/
│   ├── admin.routes.ts                  # Existing - extend with new routes
│   └── analytics.routes.ts              # New - analytics routes
├── validation/
│   ├── admin.validation.ts              # Existing - extend with new schemas
│   └── analytics.validation.ts          # New - analytics query validation
├── types/
│   ├── admin.types.ts                   # New - admin-specific types
│   ├── moderation.types.ts             # New - moderation types
│   └── analytics.types.ts               # New - analytics types
└── utils/
    └── moderation.util.ts                # New - moderation helper functions
```

### 2.2 Data Flow

#### Content Moderation Flow
```
User Reports Content / Admin Reviews Content
    ↓
[Validation Layer]
    ↓
[Moderation Service] → Check permissions, validate action
    ↓
[Database Update] → Update content status (hidden/deleted/flagged)
    ↓
[Audit Log] → Record moderation action
    ↓
[Notification] → Notify user if content is moderated (optional)
    ↓
[Response to Admin]
```

#### Analytics Flow
```
Admin Requests Analytics
    ↓
[Validation Layer] → Validate date range, filters
    ↓
[Analytics Service] → Aggregate data from multiple collections
    ↓
[Cache Check] → Check if data is cached (for expensive queries)
    ↓
[Database Aggregation] → MongoDB aggregation pipelines
    ↓
[Data Processing] → Format, calculate percentages, trends
    ↓
[Response to Admin]
```

### 2.3 Integration Points
- **Existing Admin Module**: Extend current admin routes and services
- **Prompt Module**: Add moderation fields and methods
- **Comment Module**: Add moderation fields and methods
- **User Module**: Track moderation actions per admin user
- **Prompt Optimizer Module**: Include optimization stats in analytics

---

## 3. Database Schema Changes

### 3.1 Prompt Model Extensions
```typescript
// Add to prompt.model.ts
{
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
    enum: ['spam', 'inappropriate', 'copyright', 'policy_violation', 'other'],
  },
  moderationNotes: {
    type: String,
    maxlength: 500,
  },
  flaggedCount: {
    type: Number,
    default: 0,
  },
  lastFlaggedAt: {
    type: Date,
  },
}
```

### 3.2 Comment Model Extensions
```typescript
// Add to comment.model.ts
{
  // Moderation fields (same as Prompt)
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
    enum: ['spam', 'inappropriate', 'harassment', 'other'],
  },
  moderationNotes: {
    type: String,
    maxlength: 500,
  },
  flaggedCount: {
    type: Number,
    default: 0,
  },
  lastFlaggedAt: {
    type: Date,
  },
}
```

### 3.3 ContentFlag Model (New)
```typescript
// New file: src/models/contentFlag.model.ts
{
  _id: ObjectId,
  contentType: {
    type: String,
    enum: ['prompt', 'comment'],
    required: true,
    index: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reason: {
    type: String,
    enum: ['spam', 'inappropriate', 'copyright', 'harassment', 'other'],
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
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
    enum: ['content_hidden', 'content_deleted', 'user_warned', 'no_action', 'false_report'],
  },
  resolutionNotes: {
    type: String,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}
```

### 3.4 Indexes
```typescript
// Prompt indexes
promptSchema.index({ isHidden: 1, isDeleted: 1, createdAt: -1 });
promptSchema.index({ flaggedCount: -1, lastFlaggedAt: -1 });
promptSchema.index({ deletedBy: 1 });

// Comment indexes
commentSchema.index({ isHidden: 1, isDeleted: 1, createdAt: -1 });
commentSchema.index({ flaggedCount: -1, lastFlaggedAt: -1 });
commentSchema.index({ deletedBy: 1 });

// ContentFlag indexes
contentFlagSchema.index({ contentType: 1, contentId: 1 });
contentFlagSchema.index({ status: 1, createdAt: -1 });
contentFlagSchema.index({ reportedBy: 1 });
contentFlagSchema.index({ reviewedBy: 1 });
```

---

## 4. API Endpoints

### 4.1 Content Moderation Endpoints

#### Prompt Moderation
```
GET    /api/v1/admin/prompts                    # List all prompts (with filters)
GET    /api/v1/admin/prompts/:id                # Get prompt details (admin view)
PATCH  /api/v1/admin/prompts/:id/hide           # Hide/unhide prompt
DELETE /api/v1/admin/prompts/:id                # Soft delete prompt
PATCH  /api/v1/admin/prompts/:id/restore        # Restore deleted prompt
POST   /api/v1/admin/prompts/bulk-hide          # Bulk hide prompts
POST   /api/v1/admin/prompts/bulk-delete        # Bulk delete prompts
```

#### Comment Moderation
```
GET    /api/v1/admin/comments                   # List all comments (with filters)
GET    /api/v1/admin/comments/:id               # Get comment details (admin view)
PATCH  /api/v1/admin/comments/:id/hide         # Hide/unhide comment
DELETE /api/v1/admin/comments/:id               # Soft delete comment
PATCH  /api/v1/admin/comments/:id/restore       # Restore deleted comment
POST   /api/v1/admin/comments/bulk-hide         # Bulk hide comments
POST   /api/v1/admin/comments/bulk-delete       # Bulk delete comments
```

#### Flagged Content
```
GET    /api/v1/admin/flags                      # List flagged content (with filters)
GET    /api/v1/admin/flags/:id                  # Get flag details
POST   /api/v1/admin/flags/:id/review           # Review and resolve flag
PATCH  /api/v1/admin/flags/:id/dismiss         # Dismiss flag (false report)
GET    /api/v1/admin/flags/stats                # Flag statistics
```

#### User Reporting (Public Endpoint)
```
POST   /api/v1/content/:type/:id/flag           # Report content (prompt or comment)
```

### 4.2 Analytics Endpoints

#### Dashboard Overview
```
GET    /api/v1/admin/analytics/dashboard        # Complete dashboard data
GET    /api/v1/admin/analytics/overview         # Quick overview stats
```

#### Platform Statistics
```
GET    /api/v1/admin/analytics/users            # User statistics
GET    /api/v1/admin/analytics/prompts         # Prompt statistics
GET    /api/v1/admin/analytics/comments        # Comment statistics
GET    /api/v1/admin/analytics/optimizations   # Optimization statistics
```

#### Growth Metrics
```
GET    /api/v1/admin/analytics/growth/users     # User growth over time
GET    /api/v1/admin/analytics/growth/prompts  # Prompt growth over time
GET    /api/v1/admin/analytics/growth/overview # Overall growth metrics
```

#### Engagement Metrics
```
GET    /api/v1/admin/analytics/engagement/top-prompts    # Most liked/viewed prompts
GET    /api/v1/admin/analytics/engagement/top-users      # Most active users
GET    /api/v1/admin/analytics/engagement/activity       # User activity metrics
```

#### Optimization Analytics
```
GET    /api/v1/admin/analytics/optimizations/stats       # Optimization statistics
GET    /api/v1/admin/analytics/optimizations/usage       # Usage breakdown (quick vs premium)
GET    /api/v1/admin/analytics/optimizations/quality      # Quality improvement metrics
```

### 4.3 Query Parameters

#### Common Filters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `startDate`: Start date for date range (ISO 8601)
- `endDate`: End date for date range (ISO 8601)
- `status`: Filter by status (e.g., 'pending', 'approved', 'blocked')
- `search`: Search query

#### Moderation-Specific Filters
- `isHidden`: Filter by hidden status (true/false)
- `isDeleted`: Filter by deleted status (true/false)
- `moderationReason`: Filter by moderation reason
- `flaggedOnly`: Show only flagged content (true/false)
- `contentType`: Filter by content type ('prompt' or 'comment')

#### Analytics-Specific Filters
- `period`: Time period ('day', 'week', 'month', 'year', 'custom')
- `groupBy`: Group results by ('day', 'week', 'month')
- `sortBy`: Sort field
- `sortOrder`: Sort order ('asc' or 'desc')

---

## 5. Implementation Phases

### Phase 1: Database Schema & Models (Week 1)

#### Tasks
1. **Extend Prompt Model**
   - Add moderation fields (isHidden, isDeleted, etc.)
   - Add indexes for moderation queries
   - Update existing queries to exclude deleted/hidden content by default
   - Add virtual fields for moderation status

2. **Extend Comment Model**
   - Add moderation fields (same as Prompt)
   - Add indexes
   - Update existing queries

3. **Create ContentFlag Model**
   - Define schema with all required fields
   - Add indexes
   - Create TypeScript types
   - Add validation

4. **Migration Script**
   - Create migration to add new fields to existing documents
   - Set default values for existing prompts/comments

#### Deliverables
- Updated `prompt.model.ts`
- Updated `comment.model.ts`
- New `contentFlag.model.ts`
- New `moderation.types.ts`
- Migration script

---

### Phase 2: Content Moderation Services (Week 2)

#### Tasks
1. **Create Moderation Service**
   - `moderatePrompt()` - Hide/delete/restore prompts
   - `moderateComment()` - Hide/delete/restore comments
   - `bulkModerate()` - Bulk operations
   - `getModerationHistory()` - Get moderation actions
   - Helper functions for validation and permissions

2. **Create Flag Service**
   - `flagContent()` - Create flag report
   - `reviewFlag()` - Review and resolve flag
   - `dismissFlag()` - Dismiss false reports
   - `getFlaggedContent()` - List flagged items
   - `getFlagStats()` - Flag statistics

3. **Update Existing Services**
   - Update `prompt.service.ts` to handle moderation fields
   - Update `comment.service.ts` to handle moderation fields
   - Ensure soft-deleted content is excluded from public queries

#### Deliverables
- New `moderation.service.ts`
- Updated `prompt.service.ts`
- Updated `comment.service.ts`
- Unit tests for moderation logic

---

### Phase 3: Content Moderation Controllers & Routes (Week 2-3)

#### Tasks
1. **Extend Admin Controller**
   - Add prompt moderation handlers
   - Add comment moderation handlers
   - Add flag management handlers
   - Error handling and response formatting

2. **Create Public Flag Controller**
   - Add public flag endpoint handler
   - Rate limiting for flag submissions
   - Validation and spam prevention

3. **Update Admin Routes**
   - Add all moderation endpoints
   - Add proper middleware (auth, validation, rate limiting)
   - Add Swagger documentation

4. **Create Public Flag Route**
   - Add public flag endpoint
   - Add rate limiting middleware

#### Deliverables
- Updated `admin.controller.ts`
- New `flag.controller.ts` (or extend existing)
- Updated `admin.routes.ts`
- New `flag.routes.ts` (or extend existing)
- Updated validation schemas
- Swagger documentation

---

### Phase 4: Analytics Service (Week 3-4)

#### Tasks
1. **Create Analytics Service**
   - `getDashboardStats()` - Complete dashboard data
   - `getUserStats()` - User statistics
   - `getPromptStats()` - Prompt statistics
   - `getCommentStats()` - Comment statistics
   - `getOptimizationStats()` - Optimization statistics
   - `getGrowthMetrics()` - Growth over time
   - `getEngagementMetrics()` - Engagement data
   - `getTopContent()` - Most liked/viewed content
   - `getTopUsers()` - Most active users

2. **Implement Caching**
   - Cache expensive aggregation queries
   - Cache TTL: 5-15 minutes depending on data freshness needs
   - Cache invalidation on data updates

3. **Optimize Queries**
   - Use MongoDB aggregation pipelines efficiently
   - Add compound indexes where needed
   - Implement pagination for large datasets

#### Deliverables
- New `analytics.service.ts`
- New `analytics.types.ts`
- Cache utility integration
- Performance optimizations

---

### Phase 5: Analytics Controllers & Routes (Week 4)

#### Tasks
1. **Create Analytics Controller**
   - Add all analytics endpoint handlers
   - Error handling
   - Response formatting
   - Date range validation

2. **Create Analytics Routes**
   - Add all analytics endpoints
   - Add proper middleware
   - Add Swagger documentation

3. **Add Validation**
   - Create analytics validation schemas
   - Validate date ranges
   - Validate query parameters

#### Deliverables
- New `analytics.controller.ts`
- New `analytics.routes.ts`
- New `analytics.validation.ts`
- Swagger documentation

---

### Phase 6: Testing & Documentation (Week 5)

#### Tasks
1. **Unit Tests**
   - Test moderation service functions
   - Test analytics calculations
   - Test validation schemas
   - Test error handling

2. **Integration Tests**
   - Test moderation endpoints
   - Test analytics endpoints
   - Test flag submission flow
   - Test bulk operations

3. **Documentation**
   - Update API documentation
   - Add usage examples
   - Document moderation workflow
   - Document analytics endpoints

#### Deliverables
- Unit test suite
- Integration test suite
- Updated API documentation
- Admin user guide

---

## 6. Security Considerations

### 6.1 Authentication & Authorization
- All admin endpoints require `protect` middleware
- Content moderation endpoints require `restrictTo('admin', 'superadmin')`
- Analytics endpoints require `restrictTo('admin', 'superadmin')`
- Public flag endpoint requires authentication (users can only flag content)

### 6.2 Rate Limiting
- Flag submission: Max 5 flags per user per hour
- Bulk operations: Max 100 items per request
- Analytics queries: Cache to prevent abuse

### 6.3 Input Validation
- Validate all input with Zod schemas
- Sanitize user input
- Validate ObjectIds
- Validate date ranges (max 1 year range for analytics)

### 6.4 Audit Trail
- Log all moderation actions
- Track which admin performed each action
- Store moderation reason and notes
- Timestamp all actions

### 6.5 Data Protection
- Soft deletes (don't permanently delete immediately)
- Allow content restoration
- Preserve moderation history
- Respect user privacy in analytics (aggregate data only)

---

## 7. Error Handling

### 7.1 Common Errors
- `400 Bad Request`: Invalid input, missing required fields
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Content not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server errors

### 7.2 Error Response Format
```json
{
  "status": "error",
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

---

## 8. Performance Considerations

### 8.1 Database Optimization
- Use indexes for all filtered/sorted fields
- Use aggregation pipelines for complex queries
- Implement pagination for large result sets
- Use lean queries where possible

### 8.2 Caching Strategy
- Cache dashboard stats: 5 minutes
- Cache growth metrics: 15 minutes
- Cache engagement metrics: 10 minutes
- Invalidate cache on data updates

### 8.3 Query Optimization
- Limit date ranges for analytics queries
- Use projection to limit returned fields
- Implement query result limits
- Use database indexes effectively

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Moderation service functions
- Analytics calculation functions
- Validation schemas
- Utility functions

### 9.2 Integration Tests
- Moderation API endpoints
- Analytics API endpoints
- Flag submission flow
- Bulk operations
- Permission checks

### 9.3 E2E Tests
- Complete moderation workflow
- Analytics dashboard loading
- Flag review and resolution
- Bulk moderation operations

### 9.4 Performance Tests
- Analytics query performance
- Bulk operation performance
- Concurrent flag submissions
- Cache effectiveness

---

## 10. Future Enhancements

### 10.1 Advanced Moderation
- AI-powered content detection
- Automatic spam detection
- Sentiment analysis for comments
- Image content moderation (if applicable)

### 10.2 Advanced Analytics
- User retention analysis
- Cohort analysis
- Predictive analytics
- Custom report generation
- Export to CSV/PDF

### 10.3 Moderation Features
- Moderation queue with priority
- Auto-moderation rules
- Moderation templates
- Moderation notifications
- Moderation dashboard

### 10.4 Analytics Features
- Real-time analytics
- Custom date range comparisons
- Data visualization endpoints
- Scheduled reports
- Alert system for anomalies

---

## 11. API Response Examples

### 11.1 Moderation Response
```json
{
  "status": "success",
  "message": "Prompt hidden successfully",
  "data": {
    "prompt": {
      "id": "507f1f77bcf86cd799439011",
      "title": "Example Prompt",
      "isHidden": true,
      "moderationReason": "spam",
      "moderatedAt": "2024-01-15T10:30:00Z",
      "moderatedBy": {
        "id": "507f1f77bcf86cd799439012",
        "email": "admin@example.com"
      }
    }
  }
}
```

### 11.2 Analytics Response
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalPrompts": 5432,
      "totalComments": 12345,
      "totalOptimizations": 8901
    },
    "growth": {
      "users": {
        "today": 12,
        "thisWeek": 89,
        "thisMonth": 345
      },
      "prompts": {
        "today": 45,
        "thisWeek": 312,
        "thisMonth": 1234
      }
    },
    "engagement": {
      "mostLikedPrompts": [...],
      "mostViewedPrompts": [...],
      "topUsers": [...]
    }
  }
}
```

---

## 12. Migration Guide

### 12.1 Database Migration
1. Add new fields to existing documents with default values
2. Create indexes for new fields
3. Update existing queries to handle new fields
4. Test migration on staging environment

### 12.2 Code Migration
1. Update existing services to handle moderation fields
2. Update existing controllers if needed
3. Add new routes
4. Update Swagger documentation
5. Deploy incrementally (feature flags if possible)

---

## 13. Success Metrics

### 13.1 Moderation Metrics
- Average time to review flagged content
- Number of false reports
- Content moderation accuracy
- User satisfaction with moderation

### 13.2 Analytics Metrics
- Dashboard load time
- Query performance
- Cache hit rate
- Admin usage of analytics features

---

## 14. Timeline Summary

- **Week 1**: Database schema & models
- **Week 2**: Content moderation services
- **Week 2-3**: Content moderation controllers & routes
- **Week 3-4**: Analytics service
- **Week 4**: Analytics controllers & routes
- **Week 5**: Testing & documentation

**Total Estimated Time**: 5 weeks

---

## 15. Dependencies

### 15.1 Existing Dependencies
- Express.js
- Mongoose
- Zod (validation)
- JWT (authentication)
- Cloudinary (if needed for content)

### 15.2 New Dependencies (if needed)
- None required - using existing stack

---

## 16. Notes

- All moderation actions should be logged for audit purposes
- Soft deletes are preferred over hard deletes
- Analytics queries should be cached to improve performance
- Consider implementing rate limiting for expensive operations
- Ensure all admin actions are properly authorized
- Test thoroughly before deploying to production

