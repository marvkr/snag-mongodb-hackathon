# Phase 1 Core Pipeline - Quick Start

## 1. Setup Environment Variables

Create a `.env` file in `apps/api/`:

```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:

```env
# Required for Phase 1 Core Pipeline
ANTHROPIC_API_KEY=sk-ant-...your-key...
VOYAGE_API_KEY=...your-key...
MONGODB_URI=mongodb+srv://...your-connection-string...

# Optional (for Phase 2)
FIREWORKS_API_KEY=...your-key...

PORT=3001
```

### Where to Get API Keys:

- **Anthropic (Claude)**: https://console.anthropic.com/
- **Voyage AI**: https://www.voyageai.com/
- **MongoDB Atlas**: Already provided in your existing setup

## 2. Install Dependencies

```bash
npm install
```

## 3. Start the Server

```bash
npm run dev
```

You should see:
```
✅ Successfully connected to MongoDB
✅ Database indexes created
🚀 API server running on http://localhost:3001
📸 Screenshot Processing (Phase 1):
   POST /api/screenshots/process
   GET  /api/screenshots
   GET  /api/screenshots/:id
   POST /api/screenshots/search
```

## 4. Test with Your LA Screenshots

The 4 LA travel screenshots are already in `test-data/screenshots/`.

Run the batch test:

```bash
npx tsx test-all-screenshots.ts
```

Expected output:
```
📸 Found 4 screenshot(s)

📸 Processing: screenshot_1.png
✅ Processed in 3.2s
   Primary Bucket: travel
   Confidence: 85.5%
   Places: Silver Lake, Los Angeles
   ...

[Similar for screenshots 2-4]

📊 SUMMARY
Total Processed: 4
✅ Successful: 4
❌ Failed: 0
```

## 5. Verify in MongoDB

Check that screenshots were stored:

```bash
curl http://localhost:3001/api/screenshots
```

## 6. Next: Vector Search Setup

To enable semantic search:

1. Go to MongoDB Atlas → Database → Search
2. Create Search Index with name: `screenshot_vector_index`
3. Use this configuration:

```json
{
  "fields": [{
    "path": "embedding",
    "type": "vector",
    "numDimensions": 1024,
    "similarity": "cosine"
  }]
}
```

4. Apply to `screenshots` collection in `hackathon` database

5. Test vector search:

```bash
curl -X POST http://localhost:3001/api/screenshots/search \
  -H "Content-Type: application/json" \
  -d '{"query": "beach in LA", "limit": 5}'
```

## Troubleshooting

### Missing API Keys
If you see "API key not configured" errors, make sure you've created `.env` and added all keys.

### MongoDB Connection Issues
Check that `MONGODB_URI` is correctly set in `.env`.

### Server Won't Start
Make sure you're in the `apps/api` directory and have run `npm install`.

## Phase 1 Complete! ✅

Once testing passes, you have:
- ✅ Screenshot upload and processing
- ✅ Claude Vision intent extraction
- ✅ MongoDB storage with structured intents
- ✅ Vector embeddings for search
- ✅ REST API endpoints

Your teammate can now integrate Phase 2 (Agent System) to route these intents to specialized agents.
