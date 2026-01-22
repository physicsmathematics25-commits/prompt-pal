# Prompt Optimizer Module - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Flow](#architecture--flow)
3. [API Endpoints](#api-endpoints)
4. [Testing Guide](#testing-guide)
5. [Database Schema](#database-schema)
6. [Error Handling](#error-handling)

---

## Overview

The Prompt Optimizer module enhances user-written prompts to be high-quality prompts that AI models expect. It bridges the gap between human language and AI language through two optimization modes:

- **Quick Optimization**: Fast grammar and structure fixes only (preserves intent)
- **Premium Optimization**: Interactive question-based system that asks users for details to create ultra-high-quality prompts

### Key Features
- ✅ Intent preservation (never adds unsolicited creative details)
- ✅ Two-tier optimization (Quick/Premium)
- ✅ AI-powered question generation (Google Gemini)
- ✅ Quality scoring and metrics
- ✅ Caching for performance
- ✅ Retry logic with exponential backoff

---

## Architecture & Flow

### Request Flow

```
Client Request
    ↓
Express Router (promptOptimizer.routes.ts)
    ↓
Authentication Middleware (protect)
    ↓
Validation Middleware (validate)
    ↓
Controller (promptOptimizer.controller.ts)
    ↓
Service Layer (promptOptimizer.service.ts)
    ↓
Utilities (promptAnalyzer, gemini, cache, etc.)
    ↓
Database (MongoDB - PromptOptimization Model)
    ↓
Response
```

### Component Breakdown

1. **Routes** (`src/routes/promptOptimizer.routes.ts`)
   - Defines API endpoints
   - Applies middleware (auth, validation)
   - Maps to controllers

2. **Controllers** (`src/controllers/promptOptimizer.controller.ts`)
   - Handles HTTP requests/responses
   - Extracts user ID from authenticated request
   - Calls service layer
   - Formats responses

3. **Services** (`src/services/promptOptimizer.service.ts`)
   - Business logic
   - Orchestrates utilities
   - Database operations
   - Error handling

4. **Utilities**
   - `promptAnalyzer.util.ts`: Analyzes prompts, identifies missing elements
   - `gemini.util.ts`: AI integration (question generation, prompt building)
   - `intentPreservation.util.ts`: Validates intent preservation
   - `qualityScoring.util.ts`: Calculates quality scores
   - `cache.util.ts`: In-memory caching

5. **Models** (`src/models/promptOptimization.model.ts`)
   - Mongoose schema
   - Database structure

6. **Validation** (`src/validation/promptOptimizer.schema.ts`)
   - Zod schemas
   - Input sanitization

---

## API Endpoints

### Base URL
```
/api/v1/prompt-optimizer
```

All endpoints require authentication (JWT cookie or Bearer token).

---

### 1. Quick Optimize

**Endpoint:** `POST /quick-optimize`

**Description:** Fast optimization that only fixes grammar and improves structure. Preserves user intent without adding creative details.

**Request Body:**
```json
{
  "originalPrompt": "create image of cat",
  "targetModel": "DALL-E 3",
  "mediaType": "image"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "optimization": {
      "_id": "507f1f77bcf86cd799439011",
      "originalPrompt": "create image of cat",
      "optimizedPrompt": "Create an image of a cat.",
      "targetModel": "DALL-E 3",
      "mediaType": "image",
      "optimizationType": "quick",
      "qualityScore": {
        "before": 45,
        "after": 65,
        "improvements": ["Fixed: Grammar", "Fixed: Structure"],
        "intentPreserved": true
      },
      "metadata": {
        "wordCount": {
          "before": 4,
          "after": 6
        },
        "clarityScore": {
          "before": 40,
          "after": 60
        },
        "specificityScore": {
          "before": 30,
          "after": 50
        },
        "structureScore": {
          "before": 65,
          "after": 85
        },
        "completenessScore": 35
      },
      "analysis": {
        "completenessScore": 35,
        "missingElements": ["style", "background", "lighting", "composition"],
        "grammarFixed": true,
        "structureImproved": true
      },
      "improvements": ["Fixed: Grammar", "Fixed: Structure"],
      "note": "Quick optimization preserves your original intent. Use premium optimization for more detailed prompts."
    }
  }
}
```

**Flow:**
1. Validates input (prompt min 5 chars, valid mediaType)
2. Analyzes prompt using `promptAnalyzer.util.ts`
3. Applies grammar fixes (removes "draw me", adds articles, capitalizes)
4. Calculates quality scores (before/after)
5. Creates `PromptOptimization` document in database
6. Returns optimization record

**Database Operation:**
- Creates new document in `promptoptimizations` collection
- Sets `optimizationType: 'quick'`, `status: 'completed'`

---

### 2. Analyze Prompt

**Endpoint:** `POST /analyze`

**Description:** Analyzes the prompt to identify missing elements and generates 3-5 smart questions for premium optimization. Uses AI (Gemini) to generate context-aware questions.

**Request Body:**
```json
{
  "originalPrompt": "create image of cat",
  "targetModel": "DALL-E 3",
  "mediaType": "image"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "originalPrompt": "create image of cat",
    "analysis": {
      "completenessScore": 35,
      "missingElements": ["style", "background", "lighting", "composition"],
      "grammarFixed": true,
      "structureImproved": true
    },
    "questions": [
      {
        "id": "style",
        "question": "What style do you prefer?",
        "type": "select_or_text",
        "priority": "high",
        "options": [
          { "value": "photorealistic", "label": "Photorealistic" },
          { "value": "cartoon", "label": "Cartoon/Illustration" },
          { "value": "artistic", "label": "Artistic/Painting" },
          { "value": "abstract", "label": "Abstract" },
          { "value": "minimalist", "label": "Minimalist" },
          { "value": "custom", "label": "Other (describe)", "allowsTextInput": true },
          { "value": "no_preference", "label": "No preference" }
        ],
        "default": "photorealistic",
        "required": false
      },
      {
        "id": "composition",
        "question": "How should the subject be positioned?",
        "type": "select_or_text",
        "priority": "medium",
        "options": [
          { "value": "centered", "label": "Centered" },
          { "value": "rule_of_thirds", "label": "Rule of thirds" },
          { "value": "close_up", "label": "Close-up" },
          { "value": "full_body", "label": "Full body" },
          { "value": "portrait", "label": "Portrait style" },
          { "value": "custom", "label": "Other (describe)", "allowsTextInput": true },
          { "value": "no_preference", "label": "No preference" }
        ],
        "default": "centered",
        "required": false
      },
      {
        "id": "background",
        "question": "What background do you want?",
        "type": "select_or_text",
        "priority": "medium",
        "options": [
          { "value": "indoor", "label": "Indoor" },
          { "value": "outdoor", "label": "Outdoor" },
          { "value": "studio", "label": "Studio/Plain" },
          { "value": "transparent", "label": "Transparent" },
          { "value": "natural", "label": "Natural environment" },
          { "value": "custom", "label": "Other (describe)", "allowsTextInput": true },
          { "value": "no_preference", "label": "No preference" }
        ],
        "default": "natural",
        "required": false
      },
      {
        "id": "quality",
        "question": "What quality level?",
        "type": "select",
        "priority": "low",
        "options": [
          { "value": "standard", "label": "Standard" },
          { "value": "high", "label": "High quality" },
          { "value": "professional", "label": "Professional/8K" },
          { "value": "no_preference", "label": "No preference" }
        ],
        "default": "high",
        "required": false
      }
    ],
    "additionalDetailsField": {
      "question": "Any additional details you'd like to include?",
      "type": "textarea",
      "placeholder": "E.g., colors, moods, specific details, references - Add anything else you want!",
      "required": false
    },
    "quickOptimized": "Create an image of a cat.",
    "optimizationId": "507f1f77bcf86cd799439011",
    "note": "Answer these questions to get a premium optimized prompt, or use the quick version above. All questions are optional - you can skip any or use defaults."
  }
}
```

**Flow:**
1. Validates input
2. Analyzes prompt (identifies missing elements)
3. Generates quick optimized version (fallback)
4. Checks cache for questions (if same prompt/mediaType/model)
5. If not cached:
   - Uses Gemini AI to generate context-aware questions (if available)
   - Falls back to template questions if Gemini unavailable
6. Caches questions for 30 minutes
7. Creates `PromptOptimization` document with `status: 'questions_ready'`
8. Returns questions, analysis, and optimization ID

**Database Operation:**
- Creates new document in `promptoptimizations` collection
- Sets `optimizationType: 'premium'`, `status: 'questions_ready'`
- Stores questions array (unanswered)

---

### 3. Build Premium Prompt

**Endpoint:** `POST /build`

**Description:** Builds a premium optimized prompt using user's answers to questions and additional details. Uses AI (Gemini) to intelligently combine all inputs while preserving user intent.

**Request Body:**
```json
{
  "originalPrompt": "create image of cat",
  "targetModel": "DALL-E 3",
  "mediaType": "image",
  "answers": {
    "style": {
      "type": "option",
      "value": "photorealistic"
    },
    "composition": {
      "type": "option",
      "value": "close_up"
    },
    "background": {
      "type": "custom",
      "value": "custom",
      "customText": "cozy library with bookshelves"
    },
    "quality": {
      "type": "default",
      "value": "high"
    }
  },
  "additionalDetails": "orange tabby cat, golden hour lighting, warm atmosphere"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "optimization": {
      "_id": "507f1f77bcf86cd799439011",
      "originalPrompt": "create image of cat",
      "optimizedPrompt": "Create a high-quality, photorealistic image of an orange tabby cat in a close-up composition, positioned in a cozy library with bookshelves in the background, bathed in golden hour lighting with a warm atmosphere, showcasing detailed fur texture and natural relaxed pose, professional photography style.",
      "targetModel": "DALL-E 3",
      "mediaType": "image",
      "optimizationType": "premium",
      "qualityScore": {
        "before": 45,
        "after": 92,
        "improvements": [
          "Applied user preferences",
          "Enhanced structure and clarity",
          "Improved specificity"
        ],
        "intentPreserved": true,
        "intentPreservationScore": 100,
        "comprehensive": {
          "overall": 92,
          "clarity": 95,
          "specificity": 90,
          "structure": 90,
          "completeness": 95,
          "intentPreservation": 100
        }
      },
      "metadata": {
        "wordCount": {
          "before": 4,
          "after": 42
        },
        "clarityScore": {
          "before": 40,
          "after": 95
        },
        "specificityScore": {
          "before": 30,
          "after": 90
        },
        "structureScore": {
          "before": 65,
          "after": 90
        },
        "completenessScore": 95
      },
      "improvements": [
        "Applied user preferences",
        "Enhanced structure and clarity",
        "Improved specificity"
      ]
    }
  }
}
```

**Flow:**
1. Validates input
2. Finds existing optimization record (from analyze step) with matching `originalPrompt`, `targetModel`, `mediaType`, `status: 'questions_ready'`
3. If not found, throws 404 error
4. Parses `additionalDetails` using Gemini (if available) to extract structured details
5. Builds optimized prompt using Gemini:
   - Combines original prompt + user answers + parsed additional details
   - Ensures intent preservation
6. Validates intent preservation (checks for unsolicited creative details)
7. Calculates comprehensive quality scores
8. Updates optimization record:
   - Sets `optimizedPrompt`
   - Sets `status: 'completed'`
   - Stores `userAnswers` and `additionalDetails`
   - Updates questions with answers
9. Returns completed optimization

**Database Operation:**
- Updates existing document in `promptoptimizations` collection
- Sets `status: 'completed'`, `optimizationMode: 'complete'`
- Stores `userAnswers`, `additionalDetails`, `optimizedPrompt`

---

### 4. Get Optimization History

**Endpoint:** `GET /history`

**Description:** Retrieve paginated list of user's completed optimizations with optional filtering and statistics.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `targetModel` (optional): Filter by target model
- `optimizationType` (optional): Filter by 'quick' or 'premium'

**Example Request:**
```
GET /api/v1/prompt-optimizer/history?page=1&limit=20&optimizationType=premium
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "optimizations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "originalPrompt": "create image of cat",
        "optimizedPrompt": "Create a high-quality, photorealistic image...",
        "targetModel": "DALL-E 3",
        "mediaType": "image",
        "optimizationType": "premium",
        "qualityScore": {
          "before": 45,
          "after": 92,
          "intentPreserved": true
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "totalPages": 1,
      "limit": 20
    },
    "stats": {
      "avgQualityImprovement": 47.5,
      "totalOptimizations": 15,
      "quickCount": 5,
      "premiumCount": 10
    }
  }
}
```

**Flow:**
1. Validates query parameters
2. Builds filter (user ID, status: 'completed', optional filters)
3. Queries database with pagination
4. Calculates statistics using aggregation
5. Returns paginated results + stats

**Database Operation:**
- Queries `promptoptimizations` collection
- Filters by `user`, `status: 'completed'`
- Sorts by `createdAt: -1` (newest first)
- Uses aggregation for statistics

---

### 5. Get Optimization by ID

**Endpoint:** `GET /:id`

**Description:** Retrieve detailed information about a specific optimization including questions, answers, and quality metrics.

**Path Parameters:**
- `id`: Optimization ID (MongoDB ObjectId)

**Example Request:**
```
GET /api/v1/prompt-optimizer/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "optimization": {
      "_id": "507f1f77bcf86cd799439011",
      "originalPrompt": "create image of cat",
      "optimizedPrompt": "Create a high-quality, photorealistic image...",
      "targetModel": "DALL-E 3",
      "mediaType": "image",
      "optimizationType": "premium",
      "questions": [
        {
          "id": "style",
          "question": "What style do you prefer?",
          "type": "select_or_text",
          "priority": "high",
          "answered": true,
          "answer": {
            "type": "option",
            "value": "photorealistic"
          }
        }
      ],
      "userAnswers": {
        "style": {
          "type": "option",
          "value": "photorealistic"
        }
      },
      "additionalDetails": "orange tabby cat, golden hour lighting",
      "qualityScore": {
        "before": 45,
        "after": 92,
        "intentPreserved": true
      },
      "metadata": {
        "wordCount": {
          "before": 4,
          "after": 42
        }
      },
      "analysis": {
        "completenessScore": 35,
        "missingElements": ["style", "background"]
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

**Flow:**
1. Validates ID format (MongoDB ObjectId)
2. Queries database for optimization with matching ID and user ID
3. If not found, throws 404 error
4. Returns full optimization document

**Database Operation:**
- Queries `promptoptimizations` collection
- Filters by `_id` and `user`

---

### 6. Delete Optimization

**Endpoint:** `DELETE /:id`

**Description:** Delete an optimization record. Only the owner can delete their optimizations.

**Path Parameters:**
- `id`: Optimization ID (MongoDB ObjectId)

**Example Request:**
```
DELETE /api/v1/prompt-optimizer/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Optimization deleted successfully."
}
```

**Flow:**
1. Validates ID format
2. Verifies optimization exists and belongs to user
3. Deletes document
4. Returns success message

**Database Operation:**
- Deletes document from `promptoptimizations` collection

---

### 7. Apply Optimization

**Endpoint:** `POST /:id/apply`

**Description:** Creates a new Prompt in the system using the optimized prompt. Links the new prompt to the optimization record.

**Path Parameters:**
- `id`: Optimization ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "title": "Optimized Cat Image Prompt",
  "description": "A premium optimized prompt for generating cat images",
  "tags": ["cat", "image", "optimized", "photorealistic"],
  "isPublic": true
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "prompt": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Optimized Cat Image Prompt",
      "description": "A premium optimized prompt for generating cat images",
      "promptText": "Create a high-quality, photorealistic image...",
      "originalPromptText": "create image of cat",
      "isOptimized": true,
      "optimizationId": "507f1f77bcf86cd799439011",
      "mediaType": "image",
      "aiModel": "DALL-E 3",
      "tags": ["cat", "image", "optimized", "photorealistic"],
      "isPublic": true,
      "user": {
        "_id": "507f1f77bcf86cd799439010",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:40:00.000Z"
    }
  }
}
```

**Flow:**
1. Validates ID and request body
2. Finds optimization (must be completed)
3. Creates new `Prompt` document with:
   - `promptText`: optimized prompt
   - `originalPromptText`: original prompt
   - `isOptimized`: true
   - `optimizationId`: link to optimization
4. Populates user data
5. Returns created prompt

**Database Operation:**
- Creates new document in `prompts` collection
- Links to `promptoptimizations` via `optimizationId`

---

### 8. Submit Feedback

**Endpoint:** `POST /:id/feedback`

**Description:** Submit user feedback on the quality and helpfulness of an optimization.

**Path Parameters:**
- `id`: Optimization ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "rating": 5,
  "wasHelpful": true,
  "comments": "The optimized prompt was exactly what I needed! Very helpful."
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "message": "Feedback submitted successfully.",
    "feedback": {
      "rating": 5,
      "wasHelpful": true,
      "comments": "The optimized prompt was exactly what I needed! Very helpful."
    }
  }
}
```

**Flow:**
1. Validates ID and request body
2. Finds optimization
3. Updates optimization document with feedback
4. Returns success message

**Database Operation:**
- Updates document in `promptoptimizations` collection
- Stores feedback in `feedback` field

---

## Testing Guide

### Prerequisites

1. **Authentication**: You need a valid JWT token. Login first:
   ```bash
   POST /api/v1/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   Save the token from response or cookie.

2. **Environment Variables**: Ensure `GOOGLE_AI_API_KEY` is set (for premium optimization).

### Testing Tools

- **Postman/Insomnia**: For manual API testing
- **cURL**: Command-line testing
- **Swagger UI**: Available at `http://localhost:3000/api-docs`

### Test Data Examples

#### 1. Quick Optimize Test

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/quick-optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "originalPrompt": "draw me a cat",
    "targetModel": "DALL-E 3",
    "mediaType": "image"
  }'
```

**Expected Response:**
- Status: 200
- `optimizedPrompt` should fix grammar ("draw me" → "Create")
- `intentPreserved` should be `true`
- `optimizationType` should be `"quick"`

---

#### 2. Analyze Prompt Test

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "originalPrompt": "create image of cat",
    "targetModel": "DALL-E 3",
    "mediaType": "image"
  }'
```

**Expected Response:**
- Status: 200
- `questions` array with 3-5 questions
- `optimizationId` for use in build step
- `quickOptimized` as fallback

**Save the `optimizationId` for the next step!**

---

#### 3. Build Premium Prompt Test

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/build \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "originalPrompt": "create image of cat",
    "targetModel": "DALL-E 3",
    "mediaType": "image",
    "answers": {
      "style": {
        "type": "option",
        "value": "photorealistic"
      },
      "composition": {
        "type": "option",
        "value": "close_up"
      },
      "background": {
        "type": "custom",
        "value": "custom",
        "customText": "cozy library"
      }
    },
    "additionalDetails": "orange tabby cat, golden hour lighting"
  }'
```

**Expected Response:**
- Status: 200
- `optimizedPrompt` should include user answers
- `intentPreserved` should be `true`
- `qualityScore.after` should be higher than `before`

**Note:** Must use the same `originalPrompt`, `targetModel`, and `mediaType` from analyze step.

---

#### 4. Get History Test

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/prompt-optimizer/history?page=1&limit=10&optimizationType=premium" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- Status: 200
- `optimizations` array (paginated)
- `pagination` object with totals
- `stats` object with statistics

---

#### 5. Get Optimization by ID Test

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/prompt-optimizer/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- Status: 200
- Full optimization details including questions and answers

---

#### 6. Apply Optimization Test

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/507f1f77bcf86cd799439011/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My Optimized Cat Prompt",
    "description": "A premium optimized prompt for cat images",
    "tags": ["cat", "image", "optimized"],
    "isPublic": true
  }'
```

**Expected Response:**
- Status: 201
- New `Prompt` document created
- Linked to optimization via `optimizationId`

---

#### 7. Submit Feedback Test

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/507f1f77bcf86cd799439011/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 5,
    "wasHelpful": true,
    "comments": "Great optimization! Very helpful."
  }'
```

**Expected Response:**
- Status: 200
- Success message

---

### Complete Test Flow Example

```bash
# 1. Login (get token)
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.data.token')

# 2. Quick Optimize
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/quick-optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "originalPrompt": "draw me a cat",
    "targetModel": "DALL-E 3",
    "mediaType": "image"
  }'

# 3. Analyze (get questions)
ANALYZE_RESPONSE=$(curl -X POST http://localhost:3000/api/v1/prompt-optimizer/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "originalPrompt": "create image of cat",
    "targetModel": "DALL-E 3",
    "mediaType": "image"
  }')

OPTIMIZATION_ID=$(echo $ANALYZE_RESPONSE | jq -r '.data.optimizationId')

# 4. Build Premium Prompt
curl -X POST http://localhost:3000/api/v1/prompt-optimizer/build \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "originalPrompt": "create image of cat",
    "targetModel": "DALL-E 3",
    "mediaType": "image",
    "answers": {
      "style": {"type": "option", "value": "photorealistic"},
      "composition": {"type": "option", "value": "close_up"}
    },
    "additionalDetails": "orange tabby, golden hour"
  }'

# 5. Get History
curl -X GET "http://localhost:3000/api/v1/prompt-optimizer/history?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 6. Get by ID
curl -X GET "http://localhost:3000/api/v1/prompt-optimizer/$OPTIMIZATION_ID" \
  -H "Authorization: Bearer $TOKEN"

# 7. Apply Optimization
curl -X POST "http://localhost:3000/api/v1/prompt-optimizer/$OPTIMIZATION_ID/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Cat Prompt",
    "tags": ["cat", "image"],
    "isPublic": true
  }'

# 8. Submit Feedback
curl -X POST "http://localhost:3000/api/v1/prompt-optimizer/$OPTIMIZATION_ID/feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "rating": 5,
    "wasHelpful": true,
    "comments": "Great!"
  }'
```

---

## Database Schema

### PromptOptimization Collection

```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  originalPrompt: String (required, trimmed),
  optimizedPrompt: String (trimmed),
  targetModel: String (required, trimmed),
  mediaType: String (enum: ['text', 'image', 'video', 'audio'], required),
  optimizationType: String (enum: ['quick', 'premium'], default: 'quick'),
  optimizationMode: String (enum: ['analyze', 'build', 'complete'], default: 'complete'),
  status: String (enum: ['pending', 'analyzing', 'questions_ready', 'building', 'completed', 'failed'], default: 'pending'),
  
  // Questions (for premium optimization)
  questions: [{
    id: String,
    question: String,
    type: String (enum: ['select', 'select_or_text', 'textarea']),
    priority: String (enum: ['high', 'medium', 'low']),
    answered: Boolean (default: false),
    answer: {
      type: String (enum: ['option', 'custom', 'default', 'skipped']),
      value: String,
      customText: String
    }
  }],
  
  // User answers
  userAnswers: Mixed (Object),
  additionalDetails: String (maxlength: 2000, trimmed),
  
  // Quality metrics
  qualityScore: {
    before: Number,
    after: Number,
    improvements: [String],
    intentPreserved: Boolean,
    intentPreservationScore: Number,
    comprehensive: Object
  },
  
  // Metadata
  metadata: {
    wordCount: { before: Number, after: Number },
    clarityScore: { before: Number, after: Number },
    specificityScore: { before: Number, after: Number },
    structureScore: { before: Number, after: Number },
    completenessScore: Number
  },
  
  // Analysis
  analysis: {
    completenessScore: Number,
    missingElements: [String],
    grammarFixed: Boolean,
    structureImproved: Boolean
  },
  
  // Feedback
  feedback: {
    rating: Number (min: 1, max: 5),
    wasHelpful: Boolean,
    comments: String (maxlength: 500),
    createdAt: Date
  },
  
  error: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `user`: Indexed for fast user queries
- `user + status`: For history queries
- `user + originalPrompt + targetModel + mediaType`: For finding existing optimizations

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "Validation error message",
  "errors": ["Field-specific errors"]
}
```

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "You are not logged in. Please log in to get access."
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Optimization not found."
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "message": "Failed to build optimized prompt. Please try again."
}
```

### Error Scenarios

1. **Gemini Unavailable**: Falls back to template questions
2. **API Rate Limits**: Retry logic with exponential backoff
3. **Invalid Input**: Zod validation catches and returns 400
4. **Missing Optimization**: Returns 404 if optimization not found
5. **Intent Violations**: Logged as warnings, but optimization continues

---

## Best Practices

1. **Use Quick Optimization** for simple grammar fixes
2. **Use Premium Optimization** for detailed, high-quality prompts
3. **Cache Questions** - Same prompt/mediaType/model combinations are cached
4. **Intent Preservation** - System never adds unsolicited creative details
5. **Optional Questions** - Users can skip any question or use defaults
6. **Additional Details** - Use the textarea for free-form input

---

## Environment Variables

```env
GOOGLE_AI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
OPTIMIZATION_TEMPERATURE=0.7
OPTIMIZATION_MAX_TOKENS=2000
OPTIMIZATION_CACHE_TTL_QUESTIONS=1800  # 30 minutes
OPTIMIZATION_CACHE_TTL_OPTIMIZATIONS=3600  # 1 hour
```

---

## Summary

The Prompt Optimizer module provides a comprehensive solution for enhancing user prompts:

- **Quick Optimization**: Fast grammar/structure fixes
- **Premium Optimization**: Interactive question-based system
- **Intent Preservation**: Never adds unsolicited details
- **Quality Scoring**: Metrics for improvement tracking
- **Caching**: Performance optimization
- **Full CRUD**: Create, read, update, delete optimizations
- **Integration**: Apply optimizations to create Prompts
- **Feedback**: User feedback collection

All endpoints are authenticated, validated, and documented with Swagger.

