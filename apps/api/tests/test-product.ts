import dotenv from 'dotenv';
import { connectToDatabase, getImagesCollection, closeDatabase } from '../src/db';

dotenv.config();

async function createTestProduct() {
  try {
    console.log('📝 Creating test product for Tavily integration...');
    await connectToDatabase();

    const imagesCollection = getImagesCollection();

    const testProduct = {
      id: 'test-product-001',
      bucketId: 'products',
      url: 'https://example.com/iphone.jpg',
      metadata: {
        filename: 'iphone-15-pro.jpg',
        size: 2048000,
        contentType: 'image/jpeg',
        uploadedAt: new Date()
      },
      extractedMetadata: {
        productName: 'iPhone 15 Pro',
        price: '$999'
      }
    };

    await imagesCollection.deleteOne({ id: testProduct.id });
    await imagesCollection.insertOne(testProduct);

    console.log('✅ Created test product:', testProduct.id);
    console.log('   Product:', testProduct.extractedMetadata.productName);
    console.log('   Price:', testProduct.extractedMetadata.price);

    await closeDatabase();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestProduct();
