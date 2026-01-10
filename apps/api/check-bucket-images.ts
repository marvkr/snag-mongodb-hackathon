import dotenv from 'dotenv';
import { connectToDatabase, getImagesCollection, closeDatabase } from './src/db';

dotenv.config();

async function checkBucketImages() {
  try {
    await connectToDatabase();
    const imagesCollection = getImagesCollection();

    // Get all images from travel bucket
    const travelImages = await imagesCollection
      .find({ bucketId: 'travel' })
      .sort({ 'metadata.uploadedAt': -1 })
      .limit(3)
      .toArray();

    console.log('\n🗂️  Travel Bucket Images:\n');

    travelImages.forEach((image, idx) => {
      console.log(`${idx + 1}. Image ID: ${image.id}`);
      console.log(`   Bucket: ${image.bucketId}`);
      console.log(`   Filename: ${image.metadata?.filename}`);
      console.log(`   Uploaded: ${image.metadata?.uploadedAt}`);

      if (image.extractedMetadata) {
        console.log(`   Extracted Data:`);
        if (image.extractedMetadata.places?.length > 0) {
          console.log(`     - Places: ${image.extractedMetadata.places.slice(0, 5).join(', ')}`);
        }
        if (image.extractedMetadata.entities?.length > 0) {
          console.log(`     - Entities: ${image.extractedMetadata.entities.slice(0, 5).join(', ')}`);
        }
        if (image.extractedMetadata.ocrText) {
          const preview = image.extractedMetadata.ocrText.substring(0, 100);
          console.log(`     - OCR: ${preview}...`);
        }
      }
      console.log('');
    });

    console.log(`✅ Total images in travel bucket: ${travelImages.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDatabase();
  }
}

checkBucketImages();
