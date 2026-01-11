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
  try {
    const { imageBase64, imageMediaType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    if (!process.env.VOYAGE_API_KEY) {
      return res.status(500).json({ error: 'Voyage API key not configured' });
    }

    const imagesCollection = getImagesCollection();
    const imageId = randomUUID();

    // Extract intent using Claude Vision
    const processor = new ScreenshotProcessor(process.env.ANTHROPIC_API_KEY);
    const intentData = await processor.extractIntent(imageBase64, imageMediaType);

    // Try to generate embedding (optional - graceful degradation)
    let embedding: number[] | undefined;
    try {
      embedding = await processor.generateEmbedding(imageBase64, process.env.VOYAGE_API_KEY);
    } catch (embeddingError) {
      console.warn('Failed to generate embedding:', embeddingError);
      // Continue without embedding - intent extraction is more critical
    }

    const bucketId = intentData.primary_bucket;

    // Save directly to images collection
    await imagesCollection.insertOne({
      id: imageId,
      bucketId: bucketId,
      url: '', // Can store external URL if needed
      imageBase64,
      metadata: {
        filename: `screenshot_${imageId}.${imageMediaType.split('/')[1] || 'png'}`,
        size: imageBase64.length,
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
  } catch (error) {
    console.error('Error processing screenshot:', error);
    res.status(500).json({
      error: 'Failed to process screenshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all screenshots (now uses images collection)
app.get('/api/screenshots', async (req: Request, res: Response) => {
  try {
    const { bucket, limit = 50, skip = 0 } = req.query;
    const imagesCollection = getImagesCollection();

    const filter = bucket ? { 'intent.primary_bucket': bucket } : {};
    const screenshots = await imagesCollection
      .find(filter)
      .sort({ 'metadata.uploadedAt': -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    res.json({ success: true, screenshots, count: screenshots.length });
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({
      error: 'Failed to fetch screenshots',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get specific screenshot (now uses images collection)
app.get('/api/screenshots/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imagesCollection = getImagesCollection();

    const screenshot = await imagesCollection.findOne({ id });

    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    res.json({ success: true, screenshot });
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).json({
      error: 'Failed to fetch screenshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
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

// Get all places
app.get('/api/places', async (_req: Request, res: Response) => {
  try {
    const placesCollection = getPlacesCollection();

    const places = await placesCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

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
    const placesCollection = getPlacesCollection();

    const places = await placesCollection
      .find({ sourceScreenshotId: id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, places, count: places.length });
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

// Get map region to fit all places
app.get('/api/places/region', async (_req: Request, res: Response) => {
  try {
    const placesCollection = getPlacesCollection();

    const places = await placesCollection.find().toArray();

    if (places.length === 0) {
      return res.json({ success: true, region: null });
    }

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
