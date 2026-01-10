# MongoDB Atlas Vector Search Index Setup

## Required for Vector Search Functionality

The `/api/screenshots/search` endpoint requires a MongoDB Atlas **Vector Search Index** to perform semantic similarity searches on screenshot embeddings.

## Current Status

✅ **Embeddings Working**: Screenshots are being processed with 1024-dimensional embeddings using Voyage AI
❌ **Vector Search Index**: Not yet created (required for search functionality)

## How to Create the Vector Search Index

### Option 1: MongoDB Atlas UI (Recommended)

1. **Log in to MongoDB Atlas**
   - Go to https://cloud.mongodb.com/
   - Select your cluster

2. **Navigate to Search Indexes**
   - Click on your cluster name
   - Click "Search" tab
   - Click "Create Search Index"

3. **Select JSON Editor**
   - Choose "JSON Editor" option
   - Select the `hackathon` database
   - Select the `screenshots` collection

4. **Paste this Index Definition**
   ```json
   {
     "name": "screenshot_vector_index",
     "type": "vectorSearch",
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

5. **Create the Index**
   - Click "Next"
   - Review the configuration
   - Click "Create Search Index"
   - Wait for the index to build (usually 1-2 minutes)

### Option 2: MongoDB Atlas CLI

```bash
atlas clusters search indexes create \
  --clusterName <your-cluster-name> \
  --file vector-search-index.json
```

Where `vector-search-index.json` contains:
```json
{
  "name": "screenshot_vector_index",
  "type": "vectorSearch",
  "database": "hackathon",
  "collectionName": "screenshots",
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

## Verify Index Creation

Once the index is created, test the vector search:

```bash
curl -X POST http://localhost:3001/api/screenshots/search \
  -H "Content-Type: application/json" \
  -d '{"query": "coffee shops in LA", "limit": 5}'
```

You should see results with similarity scores.

## Index Configuration Details

- **Index Name**: `screenshot_vector_index` (matches code in `src/index.ts:302`)
- **Type**: Vector Search
- **Field Path**: `embedding`
- **Dimensions**: 1024 (Voyage AI multimodal-3 embedding size)
- **Similarity Metric**: Cosine (best for semantic similarity)

## Troubleshooting

### Empty Search Results
- Ensure the index status is "Active" (not "Building")
- Verify screenshots have embeddings: `curl http://localhost:3001/api/screenshots`
- Check that `embedding` field exists and has 1024 dimensions

### Index Build Failures
- Ensure collection has at least one document with an `embedding` field
- Verify the `embedding` field is an array of numbers
- Check that array length matches `numDimensions` (1024)

## Performance Notes

- **Build Time**: ~1-2 minutes for small collections
- **Query Performance**: Sub-second for collections under 10K documents
- **Index Size**: ~4KB per document (for 1024-dim embeddings)
- **Update Latency**: Real-time (index updates automatically with new embeddings)

## Next Steps After Index Creation

1. ✅ Reprocess all screenshots to generate embeddings
2. ✅ Create vector search index (follow steps above)
3. ✅ Test search endpoint with various queries
4. ✅ Integrate search into frontend application
