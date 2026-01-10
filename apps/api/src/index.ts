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
  ObjectId,
} from './db';
import { searchForTravel, searchForProduct } from './services/tavily';
import type { SearchResultsMetadata } from './db';
import { ScreenshotProcessor } from './screenshot-processor';
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

    res.json({
      success: true,
      imageId,
      bucketId,
      intent: intentData,
      embeddingDimensions: embedding?.length || 0,
      hasEmbedding: !!embedding,
      extractedData: intentData.extracted_data,
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
      .project({ imageBase64: 0 }) // Exclude base64 data for performance
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
    const parsedJson = JSON.parse(text.trim());
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
      console.log(`\n   📸 Screenshot Processing (Phase 1):`);
      console.log(`   POST /api/screenshots/process`);
      console.log(`   GET  /api/screenshots`);
      console.log(`   GET  /api/screenshots/:id`);
      console.log(`   POST /api/screenshots/search`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
