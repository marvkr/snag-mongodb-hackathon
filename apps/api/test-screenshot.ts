import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function imageToBase64(path: string): Promise<string> {
  const buffer = await readFile(path);
  return buffer.toString('base64');
}

async function testScreenshotProcessing() {
  try {
    // Read a test image (you can replace this with any image path)
    const imagePath = process.argv[2] || './test-image.jpg';
    console.log(`📸 Reading image from: ${imagePath}`);

    const imageBase64 = await imageToBase64(imagePath);
    console.log(`✅ Image loaded (${imageBase64.length} characters base64)\n`);

    // Send to API
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    console.log(`🚀 Sending to API: ${apiUrl}/api/screenshots/process\n`);

    const response = await fetch(`${apiUrl}/api/screenshots/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        imageMediaType: 'image/jpeg',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    console.log('✅ Screenshot processed successfully!\n');
    console.log('📊 Results:');
    console.log('─'.repeat(60));
    console.log(`Screenshot ID: ${result.screenshotId}`);
    console.log(`\nPrimary Bucket: ${result.intent.primary_bucket}`);
    console.log(`Confidence: ${(result.intent.confidence * 100).toFixed(1)}%`);
    console.log(`\nRationale: ${result.intent.rationale}`);
    console.log(`\nBucket Candidates:`);
    result.intent.bucket_candidates.forEach((candidate: any) => {
      console.log(`  - ${candidate.bucket}: ${(candidate.confidence * 100).toFixed(1)}%`);
    });

    if (result.intent.extracted_data) {
      console.log(`\nExtracted Data:`);
      if (result.intent.extracted_data.ocrText) {
        console.log(`  OCR Text: ${result.intent.extracted_data.ocrText.substring(0, 100)}...`);
      }
      if (result.intent.extracted_data.places?.length > 0) {
        console.log(`  Places: ${result.intent.extracted_data.places.join(', ')}`);
      }
      if (result.intent.extracted_data.products?.length > 0) {
        console.log(`  Products: ${result.intent.extracted_data.products.join(', ')}`);
      }
    }

    console.log(`\nEmbedding Dimensions: ${result.embeddingDimensions}`);
    console.log('─'.repeat(60));

    // Test retrieval
    console.log(`\n🔍 Testing screenshot retrieval...\n`);

    const getResponse = await fetch(`${apiUrl}/api/screenshots/${result.screenshotId}`);
    if (!getResponse.ok) {
      throw new Error(`Failed to retrieve screenshot: ${getResponse.status}`);
    }

    const retrieved = await getResponse.json();
    console.log(`✅ Retrieved screenshot successfully`);
    console.log(`   Status: ${retrieved.screenshot.status}`);
    console.log(`   Intent: ${retrieved.screenshot.intent?.primary_bucket}`);

    // Test search
    console.log(`\n🔍 Testing vector search...\n`);

    const searchResponse = await fetch(`${apiUrl}/api/screenshots/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'travel destination',
        limit: 5,
      }),
    });

    if (!searchResponse.ok) {
      const searchError = await searchResponse.text();
      console.log(`⚠️  Vector search failed (index may not be created yet): ${searchError}`);
    } else {
      const searchResults = await searchResponse.json();
      console.log(`✅ Vector search completed`);
      console.log(`   Found ${searchResults.count} results`);
    }

    console.log(`\n✅ Phase 1 Core Pipeline Test Complete!`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testScreenshotProcessing();
