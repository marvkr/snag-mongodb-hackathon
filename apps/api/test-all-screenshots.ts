import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

async function imageToBase64(path: string): Promise<string> {
  const buffer = await readFile(path);
  return buffer.toString('base64');
}

async function getImageMediaType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

async function processScreenshot(imagePath: string, filename: string, apiUrl: string) {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📸 Processing: ${filename}`);
    console.log('='.repeat(70));

    const imageBase64 = await imageToBase64(imagePath);
    const imageMediaType = await getImageMediaType(filename);

    console.log(`   Size: ${(imageBase64.length / 1024 / 1024).toFixed(2)} MB (base64)`);
    console.log(`   Type: ${imageMediaType}`);

    const startTime = Date.now();

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

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    console.log(`\n✅ Processed in ${processingTime}s`);
    console.log(`   Screenshot ID: ${result.screenshotId}`);
    console.log(`\n🎯 Intent Classification:`);
    console.log(`   Primary Bucket: ${result.intent.primary_bucket}`);
    console.log(`   Confidence: ${(result.intent.confidence * 100).toFixed(1)}%`);
    console.log(`   Rationale: ${result.intent.rationale}`);

    console.log(`\n📊 All Candidates:`);
    result.intent.bucket_candidates.forEach((candidate: any) => {
      const bar = '█'.repeat(Math.floor(candidate.confidence * 20));
      console.log(`   ${candidate.bucket.padEnd(12)} ${bar} ${(candidate.confidence * 100).toFixed(1)}%`);
    });

    if (result.intent.extracted_data) {
      console.log(`\n📝 Extracted Data:`);

      if (result.intent.extracted_data.places?.length > 0) {
        console.log(`   Places: ${result.intent.extracted_data.places.join(', ')}`);
      }

      if (result.intent.extracted_data.products?.length > 0) {
        console.log(`   Products: ${result.intent.extracted_data.products.join(', ')}`);
      }

      if (result.intent.extracted_data.entities?.length > 0) {
        console.log(`   Entities: ${result.intent.extracted_data.entities.slice(0, 5).join(', ')}`);
      }

      if (result.intent.extracted_data.ocrText) {
        const ocrPreview = result.intent.extracted_data.ocrText.substring(0, 150);
        console.log(`   OCR Text: ${ocrPreview}${result.intent.extracted_data.ocrText.length > 150 ? '...' : ''}`);
      }
    }

    console.log(`\n🧮 Embedding: ${result.embeddingDimensions} dimensions`);

    return {
      success: true,
      filename,
      screenshotId: result.screenshotId,
      bucket: result.intent.primary_bucket,
      confidence: result.intent.confidence,
      processingTime: parseFloat(processingTime),
    };
  } catch (error) {
    console.error(`\n❌ Failed to process ${filename}:`, error);
    return {
      success: false,
      filename,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testAllScreenshots() {
  const screenshotsDir = './test-data/screenshots';
  const apiUrl = process.env.API_URL || 'http://localhost:3001';

  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║           Phase 1 Core Pipeline - Batch Screenshot Test          ║
╚═══════════════════════════════════════════════════════════════════╝
`);

  console.log(`📂 Screenshots directory: ${screenshotsDir}`);
  console.log(`🌐 API URL: ${apiUrl}\n`);

  try {
    // Check if server is running
    try {
      const healthCheck = await fetch(`${apiUrl}/health`);
      if (!healthCheck.ok) {
        throw new Error('Health check failed');
      }
      console.log(`✅ Server is running\n`);
    } catch (error) {
      console.error(`❌ Server is not running at ${apiUrl}`);
      console.error(`   Please start the server first: npm run dev\n`);
      process.exit(1);
    }

    // Find all image files
    const files = await readdir(screenshotsDir);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      console.log(`⚠️  No image files found in ${screenshotsDir}`);
      console.log(`   Please add your 4 LA travel screenshots to that directory\n`);
      process.exit(1);
    }

    console.log(`📸 Found ${imageFiles.length} screenshot(s)\n`);

    // Process each screenshot
    const results = [];
    for (const file of imageFiles) {
      const imagePath = join(screenshotsDir, file);
      const result = await processScreenshot(imagePath, file, apiUrl);
      results.push(result);
    }

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`\nTotal Processed: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      console.log(`\n📈 Processing Stats:`);
      const avgTime = successful.reduce((sum, r) => sum + (r.processingTime || 0), 0) / successful.length;
      const avgConfidence = successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length;

      console.log(`   Average Processing Time: ${avgTime.toFixed(2)}s`);
      console.log(`   Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

      console.log(`\n🗂️  Bucket Distribution:`);
      const buckets: Record<string, number> = {};
      successful.forEach((r) => {
        if (r.bucket) {
          buckets[r.bucket] = (buckets[r.bucket] || 0) + 1;
        }
      });

      Object.entries(buckets).forEach(([bucket, count]) => {
        console.log(`   ${bucket}: ${count} screenshot(s)`);
      });

      console.log(`\n✅ All screenshots stored in MongoDB with embeddings!`);
      console.log(`\n📍 Next Steps:`);
      console.log(`   1. View all screenshots: curl ${apiUrl}/api/screenshots`);
      console.log(`   2. Filter by travel: curl "${apiUrl}/api/screenshots?bucket=travel"`);
      console.log(`   3. Set up vector search index in MongoDB Atlas`);
      console.log(`   4. Test vector search: curl -X POST ${apiUrl}/api/screenshots/search \\`);
      console.log(`      -H "Content-Type: application/json" \\`);
      console.log(`      -d '{"query": "beach in LA", "limit": 5}'`);
    }

    if (failed.length > 0) {
      console.log(`\n❌ Failed Screenshots:`);
      failed.forEach((r) => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
    }

    console.log(`\n${'='.repeat(70)}\n`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    process.exit(1);
  }
}

testAllScreenshots();
