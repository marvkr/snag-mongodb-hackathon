import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function imageToBase64(path: string): Promise<string> {
  const buffer = await readFile(path);
  return buffer.toString('base64');
}

async function testSingleScreenshot() {
  const imagePath = './test-data/screenshots/screenshot_1.png';
  const apiUrl = process.env.API_URL || 'http://localhost:3001';

  console.log('🧪 Testing single screenshot with embedding generation\n');
  console.log(`📸 Image: ${imagePath}`);
  console.log(`🌐 API: ${apiUrl}\n`);

  try {
    const imageBase64 = await imageToBase64(imagePath);
    const imageMediaType = 'image/png';

    console.log(`   Size: ${(imageBase64.length / 1024 / 1024).toFixed(2)} MB\n`);

    const response = await fetch(`${apiUrl}/api/screenshots/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        imageMediaType,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    console.log('✅ Result:');
    console.log(`   Screenshot ID: ${result.screenshotId}`);
    console.log(`   Primary Bucket: ${result.intent.primary_bucket}`);
    console.log(`   Confidence: ${(result.intent.confidence * 100).toFixed(1)}%`);
    console.log(`   Embedding Dimensions: ${result.embeddingDimensions}`);

    if (result.embeddingDimensions > 0) {
      console.log('\n✅ Embedding generation successful!');
    } else {
      console.log('\n⚠️  No embedding generated (check Voyage API errors)');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testSingleScreenshot();
