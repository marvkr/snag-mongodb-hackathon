# Phase 1 Core Pipeline - Testing Instructions

## Prerequisites

Before testing, ensure you have the following API keys configured in `apps/api/.env`:

```bash
# Required for Phase 1
ANTHROPIC_API_KEY=your_anthropic_key
VOYAGE_API_KEY=your_voyage_key
MONGODB_URI=your_mongodb_uri

# Optional (for Phase 2 agent system)
FIREWORKS_API_KEY=your_fireworks_key
```

## Setup

1. **Install dependencies** (if not already done):
   ```bash
   cd apps/api
   npm install
   ```

2. **Create .env file**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Seed the database** (creates initial buckets):
   ```bash
   npm run seed
   ```

## Start the Server

```bash
npm run dev
```

You should see:
```
✅ Successfully connected to MongoDB
✅ Database indexes created
🚀 API server running on http://localhost:3001
📡 Available endpoints:
   GET  /health
   GET  /buckets
   ...
   📸 Screenshot Processing (Phase 1):
   POST /api/screenshots/process
   GET  /api/screenshots
   GET  /api/screenshots/:id
   POST /api/screenshots/search
```

## Testing the Core Pipeline

### Option 1: Using the Test Script

```bash
# Run with a test image
npx tsx test-screenshot.ts /path/to/your/image.jpg
```

### Option 2: Manual API Testing

#### Step 1: Process a Screenshot

```bash
# First, convert an image to base64
IMAGE_BASE64=$(base64 -i /path/to/image.jpg)

# Send to processing endpoint
curl -X POST http://localhost:3001/api/screenshots/process \
  -H "Content-Type: application/json" \
  -d "{
    \"imageBase64\": \"$IMAGE_BASE64\",
    \"imageMediaType\": \"image/jpeg\"
  }"
```

Expected response:
```json
{
  "success": true,
  "screenshotId": "uuid-here",
  "intent": {
    "primary_bucket": "travel",
    "bucket_candidates": [
      { "bucket": "travel", "confidence": 0.85 },
      { "bucket": "general", "confidence": 0.15 }
    ],
    "confidence": 0.85,
    "rationale": "The screenshot shows a beach destination...",
    "extracted_data": {
      "ocrText": "...",
      "places": ["Malibu", "Los Angeles"],
      "entities": [...]
    }
  },
  "embeddingDimensions": 1024
}
```

#### Step 2: Retrieve Screenshot

```bash
curl http://localhost:3001/api/screenshots/{screenshotId}
```

#### Step 3: List All Screenshots

```bash
# Get all screenshots
curl http://localhost:3001/api/screenshots

# Filter by bucket
curl "http://localhost:3001/api/screenshots?bucket=travel&limit=10"
```

#### Step 4: Vector Search (requires vector index)

```bash
curl -X POST http://localhost:3001/api/screenshots/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "beach destinations in California",
    "limit": 10
  }'
```

## Setting Up Vector Search Index

To enable vector search, create a vector search index in MongoDB Atlas:

1. Go to MongoDB Atlas → Database → Search
2. Create Search Index
3. Select "JSON Editor"
4. Use this configuration:

```json
{
  "name": "screenshot_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "path": "embedding",
        "type": "vector",
        "numDimensions": 1024,
        "similarity": "cosine"
      }
    ]
  }
}
```

5. Apply to the `screenshots` collection in the `hackathon` database

## Phase 1 Success Criteria

✅ Screenshot upload and processing works
✅ Claude Vision extracts intent and classifies into buckets
✅ Structured intent data stored in MongoDB
✅ Vector embeddings generated and stored
✅ Screenshots can be retrieved and filtered by bucket
✅ Vector search returns relevant screenshots (once index is created)

## Troubleshooting

### API Keys Not Configured
```
Error: Anthropic API key not configured
```
**Solution**: Add `ANTHROPIC_API_KEY` to your `.env` file

### MongoDB Connection Failed
```
Error: MONGODB_URI environment variable is not set
```
**Solution**: Add `MONGODB_URI` to your `.env` file

### Vector Search Fails
```
Error: index not found
```
**Solution**: Create the vector search index in MongoDB Atlas (see instructions above)

### Image Too Large
Claude Vision has a max image size. If your image is too large:
- Resize it to under 5MB
- Use JPEG format with compression

## Demo Scenarios for Judging

### Travel Intent
Upload a screenshot of:
- Restaurant review (Yelp, Google Maps)
- Travel blog post
- Location on Google Maps
- Hotel booking page

Expected: `primary_bucket: "travel"`, places extracted

### Shopping Intent
Upload a screenshot of:
- Product page (Amazon, etc.)
- Product review
- Price comparison

Expected: `primary_bucket: "shopping"`, products extracted

### Startup Intent
Upload a screenshot of:
- TechCrunch article
- YC company page
- Startup job listing

Expected: `primary_bucket: "startup"`, entities extracted

## Next Steps

Once Phase 1 is validated:
- Your teammate will integrate Phase 2 (Agent System with Fireworks)
- Phase 1 provides the intent extraction pipeline
- Phase 2 will use these intents to route to specialized agents
