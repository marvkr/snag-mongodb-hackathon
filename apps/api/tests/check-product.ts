import dotenv from 'dotenv';
import { connectToDatabase, getImagesCollection, closeDatabase } from './src/db';

dotenv.config();

async function checkProduct() {
  try {
    await connectToDatabase();
    const imagesCollection = getImagesCollection();
    const product = await imagesCollection.findOne({ id: 'test-product-001' });

    if (!product) {
      console.log('❌ Product not found');
      process.exit(1);
    }

    console.log('✅ Product:', product.extractedMetadata?.productName);

    if (product.searchResults) {
      console.log('\n🔍 Tavily Search Results:');
      console.log('  Query:', product.searchResults.query);
      console.log('  Result Count:', product.searchResults.resultCount);
      console.log('\n  Top 3 Results:');
      product.searchResults.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} (Score: ${r.score.toFixed(4)})`);
        console.log(`     ${r.url}`);
      });
    }

    await closeDatabase();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProduct();
