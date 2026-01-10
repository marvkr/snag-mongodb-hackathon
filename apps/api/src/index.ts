import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fireworks } from '@ai-sdk/fireworks';
import { generateText } from 'ai';
import { z } from 'zod';

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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Get all buckets
app.get('/buckets', async (_req: Request, res: Response) => {
  try {
    // TODO: Fetch from MongoDB
    // const buckets = await db.collection('buckets').find().toArray();

    // Placeholder data
    const buckets = [
      {
        id: 'travel',
        name: 'Travel',
        description: 'Extracts locations and provides travel recommendations',
        createdAt: new Date()
      },
      {
        id: 'products',
        name: 'Products',
        description: 'Analyzes products and finds similar items with reviews',
        createdAt: new Date()
      },
      {
        id: 'twitter',
        name: 'Twitter Screenshots',
        description: 'Crafts engaging replies to tweets',
        createdAt: new Date()
      },
    ];

    res.json({ success: true, buckets });
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

    // TODO: Fetch from MongoDB
    // const bucket = await db.collection('buckets').findOne({ _id: new ObjectId(id) });

    // Placeholder data
    const bucket = {
      id,
      name: 'Sample Bucket',
      description: 'This is a placeholder bucket',
      createdAt: new Date(),
      imageCount: 5
    };

    res.json({ success: true, bucket });
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

    // TODO: Fetch from MongoDB
    // const image = await db.collection('images').findOne({
    //   _id: new ObjectId(imageId),
    //   bucketId: new ObjectId(bucketId)
    // });

    // Placeholder data
    const image = {
      id: imageId,
      bucketId,
      url: 'https://example.com/image.jpg',
      metadata: {
        filename: 'sample.jpg',
        size: 1024000,
        contentType: 'image/jpeg',
        uploadedAt: new Date()
      }
    };

    res.json({ success: true, image });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      error: 'Failed to fetch image',
      message: error instanceof Error ? error.message : 'Unknown error'
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

    // TODO: Fetch image with extracted metadata from MongoDB
    // const image = await db.collection('images').findOne({
    //   _id: new ObjectId(imageId),
    //   bucketId: bucketId
    // });
    // if (!image) {
    //   return res.status(404).json({ error: 'Image not found' });
    // }
    // const extractedMetadata = image.extractedMetadata;

    // Placeholder extracted metadata (this would come from MongoDB)
    const placeholderData: Record<string, any> = {
      'travel': {
        location: 'Eiffel Tower, Paris, France',
        landmarks: ['Eiffel Tower', 'Seine River'],
        time: 'Sunset',
        description: 'Iconic view of the Eiffel Tower at golden hour'
      },
      'products': {
        productName: 'Premium Widget',
        price: '$99.99',
        description: 'High quality widget for everyday use',
        material: 'Stainless Steel',
        brand: 'WidgetCo',
        category: 'Home & Kitchen'
      },
      'twitter': {
        username: '@johndoe',
        tweetText: 'Just launched my new startup! So excited about the journey ahead. #entrepreneurship #startup',
        timestamp: '2 hours ago',
        likes: 245,
        retweets: 67
      }
    };

    const extractedMetadata = placeholderData[bucketId] || {};

    // Select schema and create prompt based on bucket type
    let schema;
    let prompt;

    switch (bucketId) {
      case 'travel':
        schema = travelOutputSchema;
        prompt = `Based on the location "${extractedMetadata.location}", provide travel recommendations.

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
        prompt = `Analyze the product "${extractedMetadata.productName}" (${extractedMetadata.price}).

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

    // TODO: Store the generated output back to MongoDB
    // await db.collection('images').updateOne(
    //   { _id: new ObjectId(imageId), bucketId: bucketId },
    //   { $set: { aiOutput: validatedOutput, generatedAt: new Date() } }
    // );

    res.json({
      success: true,
      aiOutput: validatedOutput,
      model,
      bucketId,
      imageId,
      extractedMetadata
    });
  } catch (error) {
    console.error('Error generating output:', error);
    res.status(500).json({
      error: 'Failed to generate output',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /buckets`);
  console.log(`   GET  /buckets/:id`);
  console.log(`   GET  /buckets/:bucketId/images/:imageId`);
  console.log(`   POST /api/generate/:bucketId/:imageId`);
});
