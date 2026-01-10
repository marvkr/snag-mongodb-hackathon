# Vision Pipeline API

Express.js API server with AI-powered screenshot processing, intelligent bucketing, and context-aware generation.

## Architecture Overview

The Vision Pipeline processes screenshots through multiple stages:

1. **Intent Extraction** - Claude Vision analyzes screenshots to determine category (travel/shopping/startup/general)
2. **Vector Embedding** - Voyage AI generates multimodal embeddings for semantic search
3. **Intelligent Bucketing** - Automatically organizes images into category buckets
4. **Context Enhancement** - Tavily search enriches data for travel and products
5. **AI Generation** - Fireworks AI generates category-specific insights and recommendations

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB instance
- API Keys: Anthropic, Voyage AI, Fireworks AI, Tavily (optional)

### Installation

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ANTHROPIC_API_KEY=your_anthropic_key
   VOYAGE_API_KEY=your_voyage_key
   FIREWORKS_API_KEY=your_fireworks_key
   TAVILY_API_KEY=your_tavily_key  # Optional for enhanced search
   PORT=3001
   ```

3. Install dependencies (from root):
   ```bash
   pnpm install
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

   Or from the root of the monorepo:
   ```bash
   pnpm --filter @repo/api dev
   ```

## Data Models

### Bucket
```typescript
interface Bucket {
  _id?: ObjectId;
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  imageCount?: number;  // Computed field
}
```

### ImageMetadata
```typescript
interface ImageMetadata {
  _id?: ObjectId;
  id: string;
  bucketId: string;
  url: string;
  imageBase64?: string;  // Base64 encoded image data
  metadata: {
    filename: string;
    size: number;
    contentType: string;
    uploadedAt: Date;
  };
  intent?: {
    primary_bucket: string;  // travel | shopping | startup | general
    bucket_candidates: Array<{
      bucket: string;
      confidence: number;
    }>;
    confidence: number;
    rationale: string;
  };
  extractedData?: {
    ocrText?: string;         // Text extracted from image
    entities?: string[];      // Named entities (people, places, orgs)
    places?: string[];        // Location names
    products?: string[];      // Product names
    metadata?: Record<string, any>;
  };
  embedding?: number[];       // 1024-dim vector from Voyage AI
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processedAt?: Date;
  searchResults?: SearchResultsMetadata;  // Tavily search results
  aiOutput?: Record<string, any>;         // Generated insights
  generatedAt?: Date;
}
```

### Search Results
```typescript
interface SearchResultsMetadata {
  query: string;
  results: TavilySearchResult[];
  searchedAt: Date;
  resultCount: number;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}
```

## API Endpoints

### Health Check

**GET** `/health`

Returns the health status of the API.

**Response:**
```json
{
  "status": "ok",
  "message": "API is running"
}
```

---

## Bucket Management

### Get All Buckets

**GET** `/buckets`

Retrieves all buckets with their image counts.

**Response:**
```json
{
  "success": true,
  "buckets": [
    {
      "_id": "...",
      "id": "travel",
      "name": "Travel",
      "description": "Travel destinations and guides",
      "createdAt": "2024-01-10T00:00:00.000Z",
      "imageCount": 15
    }
  ]
}
```

### Get Specific Bucket

**GET** `/buckets/:id`

Retrieves a specific bucket with its image count.

**Parameters:**
- `id` (path) - Bucket ID

**Response:**
```json
{
  "success": true,
  "bucket": {
    "_id": "...",
    "id": "travel",
    "name": "Travel",
    "description": "Travel destinations and guides",
    "createdAt": "2024-01-10T00:00:00.000Z",
    "imageCount": 15
  }
}
```

**Error Responses:**
- `404` - Bucket not found

---

## Image Management

### Get All Images in Bucket

**GET** `/buckets/:bucketId/images`

Retrieves paginated images from a bucket.

**Parameters:**
- `bucketId` (path) - Bucket ID
- `limit` (query, optional) - Number of images to return (default: 50)
- `skip` (query, optional) - Number of images to skip (default: 0)
- `includeBase64` (query, optional) - Include base64 image data ('true' | 'false', default: 'false')

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "bucketId": "travel",
      "url": "",
      "metadata": {
        "filename": "screenshot_uuid.png",
        "size": 123456,
        "contentType": "image/png",
        "uploadedAt": "2024-01-10T00:00:00.000Z"
      },
      "intent": {
        "primary_bucket": "travel",
        "bucket_candidates": [
          { "bucket": "travel", "confidence": 0.9 }
        ],
        "confidence": 0.9,
        "rationale": "Image shows a tropical beach destination"
      },
      "extractedData": {
        "ocrText": "Bali Indonesia",
        "entities": ["Bali"],
        "places": ["Bali", "Indonesia"]
      },
      "status": "completed",
      "processedAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "count": 10,
  "totalCount": 15,
  "hasMore": true
}
```

**Performance Note:** Base64 data is excluded by default for faster response times. Set `includeBase64=true` only when needed.

### Get Specific Image

**GET** `/buckets/:bucketId/images/:imageId`

Retrieves a specific image with all data including base64.

**Parameters:**
- `bucketId` (path) - Bucket ID
- `imageId` (path) - Image ID

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "bucketId": "travel",
    "imageBase64": "base64_encoded_data...",
    "metadata": { /* ... */ },
    "intent": { /* ... */ },
    "extractedData": { /* ... */ },
    "embedding": [0.123, 0.456, /* ... 1024 dimensions */],
    "aiOutput": {
      "locationDescription": "Beautiful tropical paradise...",
      "nearbyAttractions": ["Temple", "Beach", "Market"],
      "similarDestinations": ["Thailand", "Philippines"],
      "bestTimeToVisit": "April to October",
      "travelTips": ["Book early", "Try local cuisine"]
    },
    "generatedAt": "2024-01-10T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Image not found

---

## Screenshot Processing

### Process Screenshot (Phase 1)

**POST** `/api/screenshots/process`

Processes a screenshot through the complete vision pipeline:
1. Extracts intent using Claude Vision
2. Generates embedding using Voyage AI (optional)
3. Saves to appropriate bucket based on detected intent

**Request Body:**
```json
{
  "imageBase64": "base64_encoded_image_data",
  "imageMediaType": "image/jpeg"  // Optional: image/jpeg | image/png | image/gif | image/webp
}
```

**Response:**
```json
{
  "success": true,
  "imageId": "uuid",
  "bucketId": "travel",
  "intent": {
    "primary_bucket": "travel",
    "bucket_candidates": [
      { "bucket": "travel", "confidence": 0.9 },
      { "bucket": "general", "confidence": 0.1 }
    ],
    "confidence": 0.9,
    "rationale": "Image shows tropical beach destination",
    "extracted_data": {
      "ocrText": "Bali Indonesia - Best beaches",
      "entities": ["Bali", "Indonesia"],
      "places": ["Bali", "Indonesia"],
      "products": [],
      "metadata": {}
    }
  },
  "embeddingDimensions": 1024,
  "hasEmbedding": true,
  "extractedData": { /* same as intent.extracted_data */ }
}
```

**Error Responses:**
- `400` - Missing imageBase64
- `500` - API keys not configured or processing failed

**Notes:**
- Embedding generation is optional and will gracefully degrade if it fails
- Intent extraction is required and will cause the request to fail if it errors
- Images are automatically saved to the `images` collection

### Get All Screenshots

**GET** `/api/screenshots`

Retrieves screenshots with optional filtering. Base64 data excluded for performance.

**Query Parameters:**
- `bucket` (optional) - Filter by primary bucket
- `limit` (optional) - Number of screenshots (default: 50)
- `skip` (optional) - Number to skip for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "screenshots": [
    {
      "id": "uuid",
      "bucketId": "travel",
      "metadata": { /* ... */ },
      "intent": { /* ... */ },
      "extractedData": { /* ... */ },
      "status": "completed"
    }
  ],
  "count": 10
}
```

### Get Specific Screenshot

**GET** `/api/screenshots/:id`

Retrieves a specific screenshot with all data including base64.

**Parameters:**
- `id` (path) - Screenshot ID

**Response:**
```json
{
  "success": true,
  "screenshot": {
    "id": "uuid",
    "bucketId": "travel",
    "imageBase64": "base64_data...",
    "metadata": { /* ... */ },
    "intent": { /* ... */ },
    "extractedData": { /* ... */ }
  }
}
```

**Error Responses:**
- `404` - Screenshot not found

---

## Vector Search

### Search Screenshots

**POST** `/api/screenshots/search`

Performs semantic vector search across all screenshots using natural language queries.

**Request Body:**
```json
{
  "query": "tropical beaches in Southeast Asia",
  "limit": 10  // Optional, default: 10
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "bucketId": "travel",
      "metadata": {
        "uploadedAt": "2024-01-10T00:00:00.000Z"
      },
      "intent": {
        "primary_bucket": "travel",
        "confidence": 0.9,
        "rationale": "Tropical beach destination"
      },
      "extractedData": {
        "places": ["Bali", "Indonesia"]
      },
      "score": 0.87  // Vector similarity score (0-1)
    }
  ],
  "count": 5
}
```

**Requirements:**
- MongoDB Atlas vector search index named `image_vector_index` on `images.embedding`
- See [Vector Search Setup](#vector-search-setup) below

**Error Responses:**
- `400` - Missing query parameter
- `500` - API keys not configured or search failed

---

## AI Generation

### Generate Insights for Image

**POST** `/api/generate/:bucketId/:imageId`

Generates category-specific insights using AI, enhanced with real-time search data.

**Parameters:**
- `bucketId` (path) - Bucket type (travel | products | twitter)
- `imageId` (path) - Image ID

**Request Body:**
```json
{
  "model": "accounts/fireworks/models/llama-v3p3-70b-instruct"  // Optional
}
```

**Response for Travel:**
```json
{
  "success": true,
  "aiOutput": {
    "locationDescription": "Bali is a tropical paradise...",
    "nearbyAttractions": ["Uluwatu Temple", "Seminyak Beach", "Ubud Market"],
    "similarDestinations": ["Phuket, Thailand", "Boracay, Philippines"],
    "bestTimeToVisit": "April to October for dry season",
    "travelTips": [
      "Book accommodations early during peak season",
      "Try local Indonesian cuisine",
      "Respect temple dress codes"
    ]
  },
  "model": "accounts/fireworks/models/llama-v3p3-70b-instruct",
  "bucketId": "travel",
  "imageId": "uuid",
  "extractedData": {
    "places": ["Bali", "Indonesia"]
  },
  "searchResults": {
    "query": "Bali travel guide attractions activities",
    "resultCount": 5,
    "searchedAt": "2024-01-10T00:00:00.000Z"
  }
}
```

**Response for Products:**
```json
{
  "success": true,
  "aiOutput": {
    "summary": "High-end wireless headphones with active noise cancellation",
    "keyFeatures": [
      "Active noise cancellation",
      "30-hour battery life",
      "Premium build quality"
    ],
    "similarProducts": [
      "Sony WH-1000XM5",
      "Bose QuietComfort 45",
      "Apple AirPods Max"
    ],
    "whereToFind": ["Amazon", "Best Buy", "Official website"],
    "recommendation": "Great choice for frequent travelers...",
    "pros": ["Excellent sound quality", "Long battery life"],
    "cons": ["Premium price", "Heavy for extended wear"]
  },
  /* ... */
}
```

**Response for Twitter:**
```json
{
  "success": true,
  "aiOutput": {
    "professionalReply": "Thank you for sharing this insight...",
    "casualReply": "Love this take! Here's my thought...",
    "funnyReply": "Plot twist: what if...",
    "hashtags": ["#TechTwitter", "#StartupLife", "#Innovation"],
    "bestTimeToPost": "Tuesday-Thursday 9-11am EST",
    "emojiSuggestions": ["🚀", "💡", "🔥"]
  },
  /* ... */
}
```

**Features:**
- Automatically searches Tavily for travel locations and products
- Stores search results in the image document
- AI output is persisted for future retrieval
- Schema-validated responses ensure consistent structure

**Error Responses:**
- `400` - Invalid bucket type
- `404` - Image not found
- `500` - API keys not configured or generation failed

---

## Vector Search Setup

To enable semantic search, create a vector search index in MongoDB Atlas:

1. Navigate to your cluster → Search → Create Search Index
2. Select "JSON Editor" and use this configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

3. Name the index: `image_vector_index`
4. Select collection: `images`

## Development

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm clean` - Clean build artifacts

### Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with native driver
- **AI Models**:
  - Claude 3 Haiku (Vision) - Intent extraction
  - Voyage Multimodal 3 - Vector embeddings
  - Llama 3.3 70B (Fireworks) - Text generation
- **Search**: Tavily API for real-time enrichment
- **Validation**: Zod schemas for type safety

### Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `400` - Bad request (missing parameters)
- `404` - Resource not found
- `500` - Server error (API failures, database errors)

## Monitoring

Server logs include:
- Database connection status
- Search operations with timing
- Image processing status
- API errors with context

Example log output:
```
✅ Successfully connected to MongoDB
✅ Database indexes created
🚀 API server running on http://localhost:3001
🔍 [Tavily] Searching for travel: "Bali travel guide attractions activities"
✅ [Tavily] Found 5 results in 1.23s
```
