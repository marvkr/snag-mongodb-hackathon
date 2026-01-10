# MongoDB Integration Guide

## Overview

MongoDB has been successfully integrated into the API. The application now uses MongoDB for persistent storage instead of placeholder data.

## What Changed

### 1. Dependencies Added
- `mongodb`: Official MongoDB Node.js driver (v7.0.0)

### 2. New Files Created

#### `src/db.ts`
Database connection module that provides:
- MongoDB client initialization
- Database connection management
- Collection helpers
- TypeScript interfaces for Bucket and ImageMetadata
- Automatic index creation
- Graceful shutdown handling

#### `src/seed.ts`
Database seeding script to populate initial bucket data:
- Creates 3 default buckets: travel, products, twitter
- Can be run with `pnpm seed`

### 3. Updated Files

#### `src/index.ts`
- Added database connection on server startup
- Replaced all placeholder/TODO comments with actual MongoDB queries
- **GET /buckets**: Fetches all buckets from MongoDB with image counts
- **GET /buckets/:id**: Fetches specific bucket by ID
- **GET /buckets/:bucketId/images/:imageId**: Fetches specific image from MongoDB
- **POST /api/generate/:bucketId/:imageId**:
  - Fetches image with extracted metadata from MongoDB
  - Stores AI-generated output back to MongoDB

## Database Structure

### Database: `hackathon`

### Collections:

#### `buckets`
```typescript
{
  _id: ObjectId,
  id: string,        // Unique bucket identifier (travel, products, twitter)
  name: string,      // Display name
  description: string,
  createdAt: Date,
  imageCount?: number  // Computed field, not stored
}
```

Indexes:
- `id` (unique)

#### `images`
```typescript
{
  _id: ObjectId,
  id: string,
  bucketId: string,
  url: string,
  metadata: {
    filename: string,
    size: number,
    contentType: string,
    uploadedAt: Date
  },
  extractedMetadata?: Record<string, any>,  // Metadata extracted from image
  aiOutput?: Record<string, any>,            // AI-generated content
  generatedAt?: Date                          // When AI output was generated
}
```

Indexes:
- `bucketId`
- `id`

## Setup Instructions

### 1. Environment Variables

Your `.env` file already contains:
```
MONGODB_URI=
```

### 2. Seed the Database

Run the seeding script to populate initial bucket data:
```bash
cd apps/api
pnpm seed
```

Output:
```
🌱 Starting database seeding...
✅ Successfully connected to MongoDB
✅ Database indexes created
🧹 Cleared existing buckets
✅ Inserted 3 buckets
✅ Database seeding completed successfully!
```

### 3. Start the Server

```bash
pnpm dev
```

Output:
```
✅ Successfully connected to MongoDB
✅ Database indexes created
🚀 API server running on http://localhost:3001
📡 Available endpoints:
   GET  /health
   GET  /buckets
   GET  /buckets/:id
   GET  /buckets/:bucketId/images/:imageId
   POST /api/generate/:bucketId/:imageId
```

## Testing the Integration

### 1. Check Health
```bash
curl http://localhost:3001/health
```

### 2. Get All Buckets
```bash
curl http://localhost:3001/buckets
```

Expected response:
```json
{
  "success": true,
  "buckets": [
    {
      "_id": "...",
      "id": "travel",
      "name": "Travel",
      "description": "Extracts locations and provides travel recommendations",
      "createdAt": "2026-01-10T...",
      "imageCount": 0
    },
    {
      "_id": "...",
      "id": "products",
      "name": "Products",
      "description": "Analyzes products and finds similar items with reviews",
      "createdAt": "2026-01-10T...",
      "imageCount": 0
    },
    {
      "_id": "...",
      "id": "twitter",
      "name": "Twitter Screenshots",
      "description": "Crafts engaging replies to tweets",
      "createdAt": "2026-01-10T...",
      "imageCount": 0
    }
  ]
}
```

### 3. Get Specific Bucket
```bash
curl http://localhost:3001/buckets/travel
```

## Available Scripts

```bash
# Start development server
pnpm dev

# Seed database with initial buckets
pnpm seed

# Build for production
pnpm build

# Start production server
pnpm start
```

## Features

### Automatic Connection Management
- Database connection is established on server startup
- Graceful shutdown on SIGINT/SIGTERM signals
- Connection pooling handled by MongoDB driver

### Error Handling
- All endpoints include proper error handling
- 404 responses for missing resources
- 500 responses for server errors with descriptive messages

### Performance Optimizations
- Indexes created automatically on startup
- Efficient queries using indexed fields
- Connection pooling for concurrent requests

## Next Steps

To fully utilize MongoDB integration:

1. **Add Image Upload Functionality**: Create endpoints to upload images to buckets
2. **Implement Image Extraction**: Extract metadata from uploaded images
3. **Store Generated Content**: AI outputs are already being stored in MongoDB
4. **Add Pagination**: Implement pagination for bucket and image listings
5. **Add Search**: Implement search functionality across images and buckets

## Troubleshooting

### Connection Issues
If you see "MONGODB_URI environment variable is not set":
- Check that `.env` file exists in `apps/api/`
- Verify `MONGODB_URI` is set in the `.env` file
- Make sure `dotenv` is loaded before database connection

### Index Creation Errors
If indexes fail to create:
- Check database permissions
- Verify the MongoDB user has write access
- Check if indexes already exist with different options

## Security Notes

- MongoDB connection string contains credentials - ensure `.env` is in `.gitignore`
- Use environment-specific connection strings for development/staging/production
- Consider using MongoDB Atlas IP whitelisting for additional security
