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
  getScreenshotsCollection,
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
app.use(express.json());

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

    const screenshotsCollection = getScreenshotsCollection();
    const screenshotId = randomUUID();

    // Create initial screenshot record
    await screenshotsCollection.insertOne({
      id: screenshotId,
      imageBase64,
      imageUrl: '', // Can be added later if stored externally
      uploadedAt: new Date(),
      status: 'processing',
    });

    // Extract intent using Claude Vision
    const processor = new ScreenshotProcessor(process.env.ANTHROPIC_API_KEY);
    const intentData = await processor.extractIntent(imageBase64, imageMediaType);

    // Generate embedding
    const embedding = await processor.generateEmbedding(imageBase64, process.env.VOYAGE_API_KEY);

    // Update screenshot with extracted data
    await screenshotsCollection.updateOne(
      { id: screenshotId },
      {
        $set: {
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
        },
      }
    );

    res.json({
      success: true,
      screenshotId,
      intent: intentData,
      embeddingDimensions: embedding.length,
    });
  } catch (error) {
    console.error('Error processing screenshot:', error);
    res.status(500).json({
      error: 'Failed to process screenshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all screenshots
app.get('/api/screenshots', async (req: Request, res: Response) => {
  try {
    const { bucket, limit = 50, skip = 0 } = req.query;
    const screenshotsCollection = getScreenshotsCollection();

    const filter = bucket ? { 'intent.primary_bucket': bucket } : {};
    const screenshots = await screenshotsCollection
      .find(filter)
      .sort({ uploadedAt: -1 })
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

// Get specific screenshot
app.get('/api/screenshots/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const screenshotsCollection = getScreenshotsCollection();

    const screenshot = await screenshotsCollection.findOne({ id });

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

// Vector search screenshots
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

    const screenshotsCollection = getScreenshotsCollection();

    // Perform vector search
    const results = await screenshotsCollection
      .aggregate([
        {
          $vectorSearch: {
            index: 'screenshot_vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: Number(limit),
          },
        },
        {
          $project: {
            id: 1,
            uploadedAt: 1,
            intent: 1,
            extractedData: 1,
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

    // Fetch image with extracted metadata from MongoDB
    const image = await imagesCollection.findOne({
      id: imageId,
      bucketId: bucketId
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const extractedMetadata = image.extractedMetadata || {};

    // Search Tavily for travel and products buckets
    let searchResults: SearchResultsMetadata | null = null;

    if (bucketId === 'travel' && extractedMetadata.location) {
      console.log(`🔍 Searching Tavily for travel location: ${extractedMetadata.location}`);
      searchResults = await searchForTravel(extractedMetadata.location);

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
    } else if (bucketId === 'products' && extractedMetadata.productName) {
      console.log(`🔍 Searching Tavily for product: ${extractedMetadata.productName}`);
      searchResults = await searchForProduct(
        extractedMetadata.productName,
        extractedMetadata.price
      );

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

    // Select schema and create prompt based on bucket type
    let schema;
    let prompt;

    switch (bucketId) {
      case 'travel':
        schema = travelOutputSchema;
        prompt = `Based on the location "${extractedMetadata.location}", provide travel recommendations.${formatSearchResults(searchResults)}
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
        prompt = `Analyze the product "${extractedMetadata.productName}" (${extractedMetadata.price}).${formatSearchResults(searchResults)}
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
        prompt = `Craft replies to this tweet from ${extractedMetadata.username}: "${extractedMetadata.tweetText}"

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
      extractedMetadata,
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
