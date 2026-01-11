import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fireworks } from '@ai-sdk/fireworks';
import { generateText } from 'ai';
import { z } from 'zod';
import {
  connectToDatabase,
  getBucketsCollection,
  getImagesCollection,
  getPlacesCollection,
  getClustersCollection,
  ObjectId,
  Place,
  PlaceCluster,
} from './db';
import { searchForTravel, searchForProduct } from './services/tavily';
import type { SearchResultsMetadata } from './db';
import { ScreenshotProcessor } from './screenshot-processor';
import { TravelAgent } from './services/travel-agent';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Zod schemas for structured output
const travelOutputSchema = z.object({
  locationDescription: z.string(),
  nearbyAttractions: z.array(z.string()),
  similarDestinations: z.array(z.string()),
  bestTimeToVisit: z.string(),
  travelTips: z.array(z.string())
});

const productsOutputSchema = z.object({
  summary: z.string(),
  keyFeatures: z.array(z.string()),
  similarProducts: z.array(z.string()),
  whereToFind: z.array(z.string()),
  recommendation: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string())
});

const twitterOutputSchema = z.object({
  professionalReply: z.string(),
  casualReply: z.string(),
  funnyReply: z.string(),
  hashtags: z.array(z.string()),
  bestTimeToPost: z.string(),
  emojiSuggestions: z.array(z.string())
});

// Helper function to format search results for AI prompts
function formatSearchResults(searchResults: SearchResultsMetadata | null): string {
  if (!searchResults || searchResults.results.length === 0) {
    return '';
  }

  const formatted = searchResults.results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.content}\n   Source: ${r.url}`)
    .join('\n\n');

  return `\n\nREAL-TIME SEARCH RESULTS:\n${formatted}\n\nUse the above search results as factual references.\n`;
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Get all buckets
app.get('/buckets', async (_req: Request, res: Response) => {
  try {
    const bucketsCollection = getBucketsCollection();
    const imagesCollection = getImagesCollection();

    // Fetch all buckets from MongoDB
    const buckets = await bucketsCollection.find().toArray();

    // Get image counts for each bucket
    const bucketsWithCounts = await Promise.all(
      buckets.map(async (bucket) => {
        const imageCount = await imagesCollection.countDocuments({ bucketId: bucket.id });
        return {
          ...bucket,
          imageCount,
        };
      })
    );

    res.json({ success: true, buckets: bucketsWithCounts });
  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({
      error: 'Failed to fetch buckets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific bucket
app.get('/buckets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bucketsCollection = getBucketsCollection();
    const imagesCollection = getImagesCollection();

    // Fetch bucket from MongoDB by id field
    const bucket = await bucketsCollection.findOne({ id });

    if (!bucket) {
      return res.status(404).json({
        error: 'Bucket not found',
        message: `No bucket found with id: ${id}`
      });
    }

    // Get image count for this bucket
    const imageCount = await imagesCollection.countDocuments({ bucketId: id });

    res.json({
      success: true,
      bucket: {
        ...bucket,
        imageCount,
      },
    });
  } catch (error) {
    console.error('Error fetching bucket:', error);
    res.status(500).json({
      error: 'Failed to fetch bucket',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all images in a bucket
app.get('/buckets/:bucketId/images', async (req: Request, res: Response) => {
  try {
    const { bucketId } = req.params;
    const { limit = 50, skip = 0, includeBase64 = 'false' } = req.query;
    const imagesCollection = getImagesCollection();

    // Build projection - exclude base64 by default for performance
    const projection = includeBase64 === 'true' ? {} : { imageBase64: 0 };

    const images = await imagesCollection
      .find({ bucketId })
      .sort({ 'metadata.uploadedAt': -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .project(projection)
      .toArray();

    const totalCount = await imagesCollection.countDocuments({ bucketId });

    res.json({
      success: true,
      images,
      count: images.length,
      totalCount,
      hasMore: Number(skip) + images.length < totalCount
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      error: 'Failed to fetch images',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific image from bucket
app.get('/buckets/:bucketId/images/:imageId', async (req: Request, res: Response) => {
  try {
    const { bucketId, imageId } = req.params;
    const imagesCollection = getImagesCollection();

    // Fetch image from MongoDB
    const image = await imagesCollection.findOne({
      id: imageId,
      bucketId: bucketId
    });

    if (!image) {
      return res.status(404).json({
        error: 'Image not found',
        message: `No image found with id: ${imageId} in bucket: ${bucketId}`
      });
    }

    res.json({ success: true, image });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      error: 'Failed to fetch image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process screenshot with Claude Vision
app.post('/api/screenshots/process', async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[Backend:${requestId}] 📸 POST /api/screenshots/process`);

  try {
    const { imageBase64, imageMediaType = 'image/jpeg' } = req.body;
    console.log(`[Backend:${requestId}] Image media type:`, imageMediaType);
    console.log(`[Backend:${requestId}] Image base64 size:`, imageBase64?.length || 0, 'bytes');

    if (!imageBase64) {
      console.log(`[Backend:${requestId}] ❌ Missing imageBase64`);
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(`[Backend:${requestId}] ❌ Missing ANTHROPIC_API_KEY`);
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    if (!process.env.VOYAGE_API_KEY) {
      console.log(`[Backend:${requestId}] ❌ Missing VOYAGE_API_KEY`);
      return res.status(500).json({ error: 'Voyage API key not configured' });
    }

    const imagesCollection = getImagesCollection();
    const imageId = randomUUID();
    console.log(`[Backend:${requestId}] Generated image ID:`, imageId);

    // Extract intent using Claude Vision
    console.log(`[Backend:${requestId}] 🤖 Starting intent extraction...`);
    const processor = new ScreenshotProcessor(process.env.ANTHROPIC_API_KEY);
    const intentStart = Date.now();
    const intentData = await processor.extractIntent(imageBase64, imageMediaType);
    console.log(`[Backend:${requestId}] ✅ Intent extracted in ${Date.now() - intentStart}ms`);
    console.log(`[Backend:${requestId}] Primary bucket:`, intentData.primary_bucket);
    console.log(`[Backend:${requestId}] Confidence:`, intentData.confidence);

    // Generate thumbnail for faster loading in lists
    console.log(`[Backend:${requestId}] 🖼️  Generating thumbnail...`);
    let thumbnailBase64: string | undefined;
    try {
      const thumbStart = Date.now();
      thumbnailBase64 = await processor.generateThumbnail(imageBase64, 400, 400, 80);
      console.log(`[Backend:${requestId}] ✅ Generated thumbnail in ${Date.now() - thumbStart}ms (original: ${imageBase64.length} bytes, thumbnail: ${thumbnailBase64.length} bytes)`);
    } catch (thumbnailError) {
      console.warn(`[Backend:${requestId}] ⚠️  Failed to generate thumbnail:`, thumbnailError);
      // Continue without thumbnail - will use full image as fallback
    }

    // Try to generate embedding (optional - graceful degradation)
    console.log(`[Backend:${requestId}] 🧬 Generating embedding...`);
    let embedding: number[] | undefined;
    try {
      const embeddingStart = Date.now();
      embedding = await processor.generateEmbedding(imageBase64, process.env.VOYAGE_API_KEY);
      console.log(`[Backend:${requestId}] ✅ Generated embedding in ${Date.now() - embeddingStart}ms (dimensions: ${embedding.length})`);
    } catch (embeddingError) {
      console.warn(`[Backend:${requestId}] ⚠️  Failed to generate embedding:`, embeddingError);
      // Continue without embedding - intent extraction is more critical
    }

    const bucketId = intentData.primary_bucket;
    console.log(`[Backend:${requestId}] 💾 Saving to MongoDB (bucket: ${bucketId})...`);

    // Save directly to images collection
    const saveStart = Date.now();
    await imagesCollection.insertOne({
      id: imageId,
      bucketId: bucketId,
      url: '', // Can store external URL if needed
      imageBase64,
      thumbnailBase64,
      metadata: {
        filename: `screenshot_${imageId}.${imageMediaType.split('/')[1] || 'png'}`,
        size: imageBase64.length,
        thumbnailSize: thumbnailBase64?.length,
        contentType: imageMediaType,
        uploadedAt: new Date(),
      },
      intent: {
        primary_bucket: intentData.primary_bucket,
        bucket_candidates: intentData.bucket_candidates,
        confidence: intentData.confidence,
        rationale: intentData.rationale,
      },
      extractedData: intentData.extracted_data,
      embedding,
      processedAt: new Date(),
      status: 'completed',
    });
    console.log(`[Backend:${requestId}] ✅ Saved to MongoDB in ${Date.now() - saveStart}ms`);

    // Travel Agent: Process places if this is a travel bucket
    let placesProcessed = 0;
    let clustersCreated = 0;

    if (bucketId === 'travel' && intentData.extracted_data?.places && intentData.extracted_data.places.length > 0) {
      try {
        console.log(`🗺️  Travel Agent: Processing ${intentData.extracted_data.places.length} places for screenshot ${imageId}`);

        const placesCollection = getPlacesCollection();
        const clustersCollection = getClustersCollection();

        // Convert extracted places to Place objects
        const places: Place[] = intentData.extracted_data.places
          .filter(p => p.latitude !== undefined && p.longitude !== undefined)
          .map(p => ({
            id: randomUUID(),
            name: p.name,
            coordinates: {
              latitude: p.latitude!,
              longitude: p.longitude!,
            },
            sourceScreenshotId: imageId,
            createdAt: new Date(),
          }));

        if (places.length > 0) {
          // Save places to database
          await placesCollection.insertMany(places);
          placesProcessed = places.length;
          console.log(`✅ Saved ${places.length} places to database`);

          // Cluster places if we have multiple
          if (places.length > 1) {
            const travelAgent = new TravelAgent();
            const clusters = travelAgent.clusterPlaces(places);

            if (clusters.length > 0) {
              // Update places with cluster IDs
              for (const cluster of clusters) {
                await placesCollection.updateMany(
                  { id: { $in: cluster.placeIds } },
                  { $set: { clusterId: cluster.id } }
                );
              }

              // Save clusters
              const clustersToInsert: PlaceCluster[] = clusters.map(c => ({
                ...c,
                createdAt: new Date(),
              }));
              await clustersCollection.insertMany(clustersToInsert);
              clustersCreated = clusters.length;
              console.log(`✅ Created ${clusters.length} clusters`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error processing places with Travel Agent:', error);
        // Don't fail the whole request, just log the error
      }
    }

    console.log(`[Backend:${requestId}] 📤 Sending success response...`);
    res.json({
      success: true,
      imageId,
      bucketId,
      intent: intentData,
      embeddingDimensions: embedding?.length || 0,
      hasEmbedding: !!embedding,
      extractedData: intentData.extracted_data,
      travelAgent: bucketId === 'travel' ? {
        placesProcessed,
        clustersCreated,
      } : undefined,
    });
    console.log(`[Backend:${requestId}] ✅ Screenshot processed successfully\n`);
  } catch (error) {
    console.error(`[Backend:${requestId}] ❌ Error processing screenshot:`, error);
    console.error(`[Backend:${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Failed to process screenshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`[Backend:${requestId}] ❌ Error response sent\n`);
  }
});

// Get all screenshots (now uses images collection)
app.get('/api/screenshots', async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[Backend:${requestId}] 🎯 GET /api/screenshots`);
  console.log(`[Backend:${requestId}] Query params:`, req.query);
  console.log(`[Backend:${requestId}] Headers:`, {
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
  });

  try {
    const { bucket, limit = 50, skip = 0 } = req.query;
    console.log(`[Backend:${requestId}] Parsed params - bucket:`, bucket, 'limit:', limit, 'skip:', skip);

    const imagesCollection = getImagesCollection();
    console.log(`[Backend:${requestId}] ✅ Got images collection`);

    const filter = bucket ? { 'intent.primary_bucket': bucket } : {};
    console.log(`[Backend:${requestId}] MongoDB filter:`, JSON.stringify(filter));

    console.log(`[Backend:${requestId}] 📡 Querying MongoDB...`);
    const queryStart = Date.now();

    const screenshots = await imagesCollection
      .find(filter)
      .sort({ 'metadata.uploadedAt': -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      // Always exclude embeddings for performance
      .project({ embedding: 0 })
      .toArray();

    const queryDuration = Date.now() - queryStart;
    console.log(`[Backend:${requestId}] ✅ MongoDB query complete in ${queryDuration}ms`);
    console.log(`[Backend:${requestId}] Found ${screenshots.length} screenshots`);

    if (screenshots.length > 0) {
      const first = screenshots[0];
      console.log(`[Backend:${requestId}] First screenshot sample:`, {
        id: first.id,
        bucketId: first.bucketId,
        hasImageBase64: !!first.imageBase64,
        hasThumbnail: !!first.thumbnailBase64,
        imageBase64Length: first.imageBase64?.length,
        thumbnailLength: first.thumbnailBase64?.length,
        uploadedAt: first.metadata?.uploadedAt,
        allKeys: Object.keys(first),  // Show all available fields
      });

      // Count how many have image data
      const withImage = screenshots.filter(s => s.imageBase64).length;
      const withThumbnail = screenshots.filter(s => s.thumbnailBase64).length;
      console.log(`[Backend:${requestId}] 📊 Stats: ${withImage}/${screenshots.length} have imageBase64, ${withThumbnail}/${screenshots.length} have thumbnails`);
    }

    // Post-process: Compress images on-the-fly (don't modify database)
    console.log(`[Backend:${requestId}] 🔄 Compressing screenshots on-the-fly...`);
    const processor = new ScreenshotProcessor(process.env.ANTHROPIC_API_KEY || '');

    const optimizedScreenshots = await Promise.all(
      screenshots.map(async (screenshot) => {
        // If has pre-generated thumbnail, use it
        if (screenshot.thumbnailBase64) {
          const { imageBase64, ...rest } = screenshot;
          return rest;
        }

        // Otherwise, compress full image on-the-fly
        if (screenshot.imageBase64) {
          try {
            console.log(`[Backend:${requestId}] Compressing ${screenshot.id} (${(screenshot.imageBase64.length / 1024).toFixed(0)}KB)...`);
            const thumbnailBase64 = await processor.generateThumbnail(screenshot.imageBase64, 400, 400, 80);
            console.log(`[Backend:${requestId}] ✅ Compressed to ${(thumbnailBase64.length / 1024).toFixed(0)}KB`);

            const { imageBase64, ...rest } = screenshot;
            return {
              ...rest,
              thumbnailBase64, // Send compressed version
            };
          } catch (error) {
            console.error(`[Backend:${requestId}] ⚠️ Compression failed for ${screenshot.id}:`, error);
            // Fallback: return without image
            const { imageBase64, ...rest } = screenshot;
            return rest;
          }
        }

        return screenshot;
      })
    );

    console.log(`[Backend:${requestId}] ✅ Optimized ${optimizedScreenshots.length} screenshots`);
    console.log(`[Backend:${requestId}] 📤 Sending response...`);

    const responseSize = JSON.stringify(optimizedScreenshots).length;
    console.log(`[Backend:${requestId}] Response size: ${(responseSize / 1024).toFixed(2)} KB`);

    res.json({ success: true, screenshots: optimizedScreenshots, count: optimizedScreenshots.length });
    console.log(`[Backend:${requestId}] ✅ Response sent successfully\n`);
  } catch (error) {
    console.error(`[Backend:${requestId}] ❌ Error fetching screenshots:`, error);
    console.error(`[Backend:${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Failed to fetch screenshots',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`[Backend:${requestId}] ❌ Error response sent\n`);
  }
});

// Get specific screenshot (now uses images collection)
app.get('/api/screenshots/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imagesCollection = getImagesCollection();

    // Exclude imageBase64 for performance - use /api/screenshots/:id/image for image data
    const screenshot = await imagesCollection.findOne(
      { id },
      { projection: { imageBase64: 0, embedding: 0 } }
    );

    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    // Add URL to fetch image separately
    const screenshotWithUrl = {
      ...screenshot,
      url: `/api/screenshots/${id}/image`,
    };

    res.json({ success: true, screenshot: screenshotWithUrl });
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).json({
      error: 'Failed to fetch screenshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get screenshot image (returns base64 or serves image)
app.get('/api/screenshots/:id/image', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imagesCollection = getImagesCollection();

    const screenshot = await imagesCollection.findOne(
      { id },
      { projection: { imageBase64: 1, 'metadata.contentType': 1 } }
    );

    if (!screenshot || !screenshot.imageBase64) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Return as actual image
    const imageBuffer = Buffer.from(screenshot.imageBase64, 'base64');
    const contentType = screenshot.metadata?.contentType || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error fetching screenshot image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Vector search screenshots (now uses images collection)
app.post('/api/screenshots/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY || !process.env.VOYAGE_API_KEY) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    const processor = new ScreenshotProcessor(process.env.ANTHROPIC_API_KEY);
    const queryEmbedding = await processor.generateTextEmbedding(query, process.env.VOYAGE_API_KEY);

    const imagesCollection = getImagesCollection();

    // Perform vector search
    const results = await imagesCollection
      .aggregate([
        {
          $vectorSearch: {
            index: 'image_vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: Number(limit),
          },
        },
        {
          $project: {
            id: 1,
            'metadata.uploadedAt': 1,
            intent: 1,
            extractedData: 1,
            bucketId: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ])
      .toArray();

    res.json({ success: true, results, count: results.length });
  } catch (error) {
    console.error('Error searching screenshots:', error);
    res.status(500).json({
      error: 'Failed to search screenshots',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// AI generation with bucket/image context
app.post('/api/generate/:bucketId/:imageId', async (req: Request, res: Response) => {
  try {
    const { bucketId, imageId } = req.params;
    const { model = 'accounts/fireworks/models/llama-v3p3-70b-instruct' } = req.body;

    if (!process.env.FIREWORKS_API_KEY) {
      return res.status(500).json({ error: 'Fireworks API key not configured' });
    }

    const imagesCollection = getImagesCollection();

    // Fetch image with extracted data from MongoDB
    const image = await imagesCollection.findOne({
      id: imageId,
      bucketId: bucketId
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const extractedData = image.extractedData || {};

    // Search Tavily for travel and products buckets
    let searchResults: SearchResultsMetadata | null = null;

    // For travel: try to find location in places array or entities
    if (bucketId === 'travel') {
      const location = extractedData.places?.[0] || extractedData.entities?.[0];
      if (location) {
        console.log(`🔍 Searching Tavily for travel location: ${location}`);
        searchResults = await searchForTravel(location);

        if (searchResults) {
          try {
            await imagesCollection.updateOne(
              { id: imageId, bucketId: bucketId },
              { $set: { searchResults } }
            );
            console.log(`✅ Stored ${searchResults.resultCount} Tavily results for ${imageId}`);
          } catch (dbError) {
            console.error('❌ Failed to store search results:', dbError);
            // Continue - AI generation not affected
          }
        }
      }
    }
    // For products: try to find product in products array or entities
    else if (bucketId === 'products') {
      const productName = extractedData.products?.[0] || extractedData.entities?.[0];
      if (productName) {
        console.log(`🔍 Searching Tavily for product: ${productName}`);
        searchResults = await searchForProduct(productName);

        if (searchResults) {
          try {
            await imagesCollection.updateOne(
              { id: imageId, bucketId: bucketId },
              { $set: { searchResults } }
            );
            console.log(`✅ Stored ${searchResults.resultCount} Tavily results for ${imageId}`);
          } catch (dbError) {
            console.error('❌ Failed to store search results:', dbError);
            // Continue - AI generation not affected
          }
        }
      }
    }

    // Select schema and create prompt based on bucket type
    let schema;
    let prompt;

    // Format extracted data for the AI
    const extractedDataStr = JSON.stringify(extractedData, null, 2);

    switch (bucketId) {
      case 'travel':
        schema = travelOutputSchema;
        prompt = `You are analyzing a travel-related screenshot. Here is the extracted data:

${extractedDataStr}

Based on the extracted data above (look for locations in places, entities, or text), provide travel recommendations.${formatSearchResults(searchResults)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "locationDescription": "string",
  "nearbyAttractions": ["attraction 1", "attraction 2", "attraction 3"],
  "similarDestinations": ["destination 1", "destination 2", "destination 3"],
  "bestTimeToVisit": "string",
  "travelTips": ["tip 1", "tip 2", "tip 3"]
}`;
        break;

      case 'products':
        schema = productsOutputSchema;
        prompt = `You are analyzing a product/shopping screenshot. Here is the extracted data:

${extractedDataStr}

Based on the extracted data above (look for products, prices, or descriptions in the data), provide product analysis.${formatSearchResults(searchResults)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "summary": "string",
  "keyFeatures": ["feature 1", "feature 2", "feature 3"],
  "similarProducts": ["product 1", "product 2", "product 3"],
  "whereToFind": ["store 1", "store 2", "store 3"],
  "recommendation": "string",
  "pros": ["pro 1", "pro 2"],
  "cons": ["con 1", "con 2"]
}`;
        break;

      case 'twitter':
        schema = twitterOutputSchema;
        prompt = `You are analyzing a Twitter/social media screenshot. Here is the extracted data:

${extractedDataStr}

Based on the extracted data above (look for usernames, tweet text, or social media content), craft engaging replies.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "professionalReply": "string",
  "casualReply": "string",
  "funnyReply": "string",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "bestTimeToPost": "string",
  "emojiSuggestions": ["emoji1", "emoji2"]
}`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid bucket type. Must be: travel, products, or twitter' });
    }

    const { text } = await generateText({
      model: fireworks(model),
      prompt,
    });

    // Parse and validate JSON response
    // Remove markdown code blocks if present
    const cleanedJson = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedJson = JSON.parse(cleanedJson);
    const validatedOutput = schema.parse(parsedJson);

    // Store the generated output back to MongoDB
    await imagesCollection.updateOne(
      { id: imageId, bucketId: bucketId },
      { $set: { aiOutput: validatedOutput, generatedAt: new Date() } }
    );

    res.json({
      success: true,
      aiOutput: validatedOutput,
      model,
      bucketId,
      imageId,
      extractedData,
      ...(searchResults && {
        searchResults: {
          query: searchResults.query,
          resultCount: searchResults.resultCount,
          searchedAt: searchResults.searchedAt
        }
      })
    });
  } catch (error) {
    console.error('Error generating output:', error);
    res.status(500).json({
      error: 'Failed to generate output',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all places (extracted from images.extractedData.location)
app.get('/api/places', async (_req: Request, res: Response) => {
  try {
    const imagesCollection = getImagesCollection();

    // Get all images with extractedData.location
    const images = await imagesCollection
      .find({ 'extractedData.location': { $exists: true } })
      .sort({ 'metadata.uploadedAt': -1 })
      .toArray();

    // Transform to places format
    const places = images
      .filter(img => img.extractedData?.location?.coordinates)
      .map(img => ({
        id: img.id,
        name: img.extractedData?.location?.name || 'Unknown',
        address: img.extractedData?.location?.address,
        coordinates: {
          latitude: img.extractedData?.location?.coordinates?.lat,
          longitude: img.extractedData?.location?.coordinates?.lng,
        },
        sourceScreenshotId: img.id,
        placeId: img.extractedData?.location?.placeId,
        googleMapsUrl: img.extractedData?.location?.googleMapsUrl,
        createdAt: img.metadata?.uploadedAt || new Date(),
      }));

    res.json({ success: true, places, count: places.length });
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({
      error: 'Failed to fetch places',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get places for a specific screenshot
app.get('/api/screenshots/:id/places', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imagesCollection = getImagesCollection();

    const image = await imagesCollection.findOne({ id });

    if (!image || !image.extractedData?.location?.coordinates) {
      return res.json({ success: true, places: [], count: 0 });
    }

    const place = {
      id: image.id,
      name: image.extractedData?.location?.name || 'Unknown',
      address: image.extractedData?.location?.address,
      coordinates: {
        latitude: image.extractedData?.location?.coordinates?.lat,
        longitude: image.extractedData?.location?.coordinates?.lng,
      },
      sourceScreenshotId: image.id,
      placeId: image.extractedData?.location?.placeId,
      googleMapsUrl: image.extractedData?.location?.googleMapsUrl,
      createdAt: image.metadata?.uploadedAt || new Date(),
    };

    res.json({ success: true, places: [place], count: 1 });
  } catch (error) {
    console.error('Error fetching places for screenshot:', error);
    res.status(500).json({
      error: 'Failed to fetch places',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all clusters
app.get('/api/places/clusters', async (_req: Request, res: Response) => {
  try {
    const clustersCollection = getClustersCollection();

    const clusters = await clustersCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, clusters, count: clusters.length });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({
      error: 'Failed to fetch clusters',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get map region to fit all places (from images.extractedData.location)
app.get('/api/places/region', async (_req: Request, res: Response) => {
  try {
    const imagesCollection = getImagesCollection();

    const images = await imagesCollection
      .find({ 'extractedData.location.coordinates': { $exists: true } })
      .toArray();

    if (images.length === 0) {
      return res.json({ success: true, region: null });
    }

    // Transform to places format for region calculation
    const places = images.map(img => ({
      coordinates: {
        latitude: img.extractedData?.location?.coordinates?.lat,
        longitude: img.extractedData?.location?.coordinates?.lng,
      },
    }));

    const region = TravelAgent.calculateMapRegion(places);

    res.json({ success: true, region });
  } catch (error) {
    console.error('Error calculating map region:', error);
    res.status(500).json({
      error: 'Failed to calculate map region',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📡 Available endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /buckets`);
      console.log(`   GET  /buckets/:id`);
      console.log(`   GET  /buckets/:bucketId/images/:imageId`);
      console.log(`   POST /api/generate/:bucketId/:imageId`);
      console.log(`\n   📸 Screenshot Processing:`);
      console.log(`   POST /api/screenshots/process`);
      console.log(`   GET  /api/screenshots`);
      console.log(`   GET  /api/screenshots/:id`);
      console.log(`   POST /api/screenshots/search`);
      console.log(`\n   🗺️  Places & Travel Agent:`);
      console.log(`   GET  /api/places`);
      console.log(`   GET  /api/screenshots/:id/places`);
      console.log(`   GET  /api/places/clusters`);
      console.log(`   GET  /api/places/region`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
