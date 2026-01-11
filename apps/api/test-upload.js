const fs = require('fs');
const path = require('path');

// Read the screenshot file
const screenshotPath = path.join(__dirname, 'test-data/screenshots/screenshot_5.png');
const imageBuffer = fs.readFileSync(screenshotPath);
const imageBase64 = imageBuffer.toString('base64');

console.log('📸 Screenshot loaded:', screenshotPath);
console.log('📦 Image size:', (imageBase64.length / 1024 / 1024).toFixed(2), 'MB (base64)');

// Call the API
const API_URL = process.env.API_URL || 'http://localhost:3001';

async function uploadScreenshot() {
  try {
    console.log(`\n🚀 Uploading to ${API_URL}/api/screenshots/process...`);

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

    console.log('\n✅ SUCCESS! Screenshot processed:\n');
    console.log('Image ID:', result.imageId);
    console.log('Bucket:', result.bucketId);
    console.log('Confidence:', result.intent.confidence);
    console.log('Rationale:', result.intent.rationale);
    console.log('\n📍 Extracted Places:', result.extractedData?.places || []);
    console.log('🏢 Extracted Entities:', result.extractedData?.entities || []);
    console.log('📝 OCR Text (first 200 chars):', (result.extractedData?.ocrText || '').substring(0, 200));
    console.log('\n🔢 Embedding:', result.hasEmbedding ? `${result.embeddingDimensions}D vector` : 'Not generated');

    return result;
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

// Run the upload
uploadScreenshot()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
