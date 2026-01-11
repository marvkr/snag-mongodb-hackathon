import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Zod schema for intent extraction output
const IntentExtractionSchema = z.object({
  primary_bucket: z.enum(['travel', 'shopping', 'startup', 'general']),
  bucket_candidates: z.array(
    z.object({
      bucket: z.enum(['travel', 'shopping', 'startup', 'general']),
      confidence: z.number().min(0).max(1),
    })
  ),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  extracted_data: z.object({
    ocrText: z.string().optional(),
    entities: z.array(z.string()).optional(),
    places: z.array(z.object({
      name: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })).optional(),
    products: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export type IntentExtraction = z.infer<typeof IntentExtractionSchema>;

export class ScreenshotProcessor {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Extract intent from a screenshot using Claude Vision
   */
  async extractIntent(imageBase64: string, imageMediaType: string = 'image/jpeg'): Promise<IntentExtraction> {
    const prompt = `You are an expert at analyzing screenshots and inferring user intent.

Analyze this screenshot and determine:
1. What the user is interested in based on the visual content
2. Which category this screenshot belongs to:
   - travel: locations, destinations, maps, places to visit, restaurants, hotels, cafes
   - shopping: fashion posts, clothing, accessories, beauty products, product photos, influencer content showing items, e-commerce sites, reviews, pricing, items to buy, outfit posts, product recommendations, shopping hauls, product displays
   - startup: company info, funding, tech news, startup opportunities, business ideas, tech industry content
   - general: anything that doesn't clearly fit the above categories

IMPORTANT CLASSIFICATION RULES:
- If you see clothing, fashion, accessories, beauty items, or product displays → classify as "shopping"
- If you see social media posts featuring products, outfits, or items → classify as "shopping"
- If you see location names, places, restaurants, or travel destinations → classify as "travel"
- Only use "general" if content truly doesn't fit travel, shopping, or startup categories

3. Extract relevant data:
   - Any text visible in the screenshot (OCR)
   - Named entities (people, places, organizations, products)
   - Specific places or locations mentioned WITH their approximate latitude and longitude coordinates
   - Products or items visible
   - Any other relevant metadata

IMPORTANT: For each place, provide the name AND approximate coordinates (latitude, longitude).
Use your knowledge to estimate coordinates for well-known places, cities, or landmarks.

Provide your analysis as a structured JSON response EXACTLY in this format:

{
  "primary_bucket": "travel",
  "bucket_candidates": [
    {"bucket": "travel", "confidence": 0.8},
    {"bucket": "general", "confidence": 0.2}
  ],
  "confidence": 0.8,
  "rationale": "brief explanation",
  "extracted_data": {
    "ocrText": "visible text",
    "entities": ["entity1", "entity2"],
    "places": [
      {"name": "Eiffel Tower", "latitude": 48.8584, "longitude": 2.2945},
      {"name": "Paris, France", "latitude": 48.8566, "longitude": 2.3522}
    ],
    "products": ["product1"],
    "metadata": {}
  }
}

CRITICAL:
- bucket_candidates MUST be an array of objects, not a single object.
- places MUST be an array of objects with name, latitude, and longitude fields.
- Provide coordinates even if approximate - use your world knowledge.
Return ONLY the JSON, no markdown, no explanation.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      // Parse and validate JSON response
      const jsonText = textContent.text.trim();

      // Remove markdown code blocks if present
      const cleanedJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsedResponse = JSON.parse(cleanedJson);
      const validatedResponse = IntentExtractionSchema.parse(parsedResponse);

      return validatedResponse;
    } catch (error) {
      console.error('Error extracting intent with Claude:', error);
      throw new Error(`Failed to extract intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for a screenshot using Voyage AI
   */
  async generateEmbedding(imageBase64: string, voyageApiKey: string): Promise<number[]> {
    try {
      // Ensure we have the full data URI format (Voyage requires it)
      const dataUri = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`;

      const response = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${voyageApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voyage-multimodal-3',
          inputs: [{ content: [{ type: 'image_base64', image_base64: dataUri }] }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voyage API error: ${error}`);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text embeddings using Voyage AI (for search queries)
   */
  async generateTextEmbedding(text: string, voyageApiKey: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${voyageApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voyage-multimodal-3',
          inputs: [{ content: [{ type: 'text', text }] }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voyage API error: ${error}`);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating text embedding:', error);
      throw new Error(`Failed to generate text embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
