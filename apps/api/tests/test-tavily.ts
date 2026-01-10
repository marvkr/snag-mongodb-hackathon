import dotenv from 'dotenv';
import { connectToDatabase, getImagesCollection, closeDatabase } from '../src/db';

dotenv.config();

async function createTestImage() {
  try {
    console.log('📝 Creating test image for Tavily integration...');
    await connectToDatabase();

    const imagesCollection = getImagesCollection();

    // Create a test travel image
    const testImage = {
      id: 'test-paris-001',
      bucketId: 'travel',
      url: 'https://example.com/paris.jpg',
      metadata: {
        filename: 'paris-eiffel-tower.jpg',
        size: 1024000,
        contentType: 'image/jpeg',
        uploadedAt: new Date()
      },
      extractedMetadata: {
        location: 'Paris France',
        description: 'Eiffel Tower at sunset'
      }
    };

    // Delete if exists
    await imagesCollection.deleteOne({ id: testImage.id });

    // Insert test image
    await imagesCollection.insertOne(testImage);
    console.log('✅ Created test image:', testImage.id);
    console.log('   Location:', testImage.extractedMetadata.location);

    await closeDatabase();
  } catch (error) {
    console.error('❌ Error creating test image:', error);
    process.exit(1);
  }
}

createTestImage();
