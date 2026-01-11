const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const screenshotsDir = path.join(__dirname, 'test-data/screenshots');

async function processScreenshot(filename) {
  const screenshotPath = path.join(screenshotsDir, filename);

  if (!fs.existsSync(screenshotPath)) {
    console.log(`⚠️  ${filename} not found, skipping...`);
    return null;
  }

  const imageBuffer = fs.readFileSync(screenshotPath);
  const imageBase64 = imageBuffer.toString('base64');

  console.log(`\n📸 Processing ${filename}...`);
  console.log(`   Size: ${(imageBase64.length / 1024 / 1024).toFixed(2)} MB (base64)`);

  try {
    const response = await fetch(`${API_URL}/api/screenshots/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        imageMediaType: 'image/png',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log(`✅ ${filename} processed successfully!`);
    console.log(`   Image ID: ${result.imageId}`);
    console.log(`   Bucket: ${result.bucketId}`);
    console.log(`   Confidence: ${result.intent.confidence}`);

    if (result.extractedData?.places) {
      console.log(`   Places: ${result.extractedData.places.length} found`);
      result.extractedData.places.forEach(p => {
        console.log(`      - ${p.name}${p.latitude ? ` (${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)})` : ''}`);
      });
    }

    if (result.travelAgent) {
      console.log(`   Travel Agent: ${result.travelAgent.placesProcessed} places, ${result.travelAgent.clustersCreated} clusters`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Failed to process ${filename}:`, error.message);
    return null;
  }
}

async function processAllScreenshots() {
  console.log('🚀 Processing all screenshots...\n');
  console.log('='.repeat(60));

  const screenshots = [
    'screenshot_1.png',
    'screenshot_2.png',
    'screenshot_3.png',
    'screenshot_4.png',
    'screenshot_5.png',
  ];

  const results = [];

  for (const screenshot of screenshots) {
    const result = await processScreenshot(screenshot);
    if (result) {
      results.push(result);
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Completed! Processed ${results.length}/${screenshots.length} screenshots`);

  const travelResults = results.filter(r => r.bucketId === 'travel');
  const totalPlaces = travelResults.reduce((sum, r) => sum + (r.travelAgent?.placesProcessed || 0), 0);
  const totalClusters = travelResults.reduce((sum, r) => sum + (r.travelAgent?.clustersCreated || 0), 0);

  console.log(`\n📊 Summary:`);
  console.log(`   - Travel screenshots: ${travelResults.length}`);
  console.log(`   - Total places extracted: ${totalPlaces}`);
  console.log(`   - Total clusters created: ${totalClusters}`);
}

processAllScreenshots()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
