import dotenv from 'dotenv';
import { connectToDatabase, getImagesCollection, closeDatabase } from './src/db';

dotenv.config();

async function verifyStorage() {
  try {
    console.log('🔍 Verifying search results storage in MongoDB...\n');
    await connectToDatabase();

    const imagesCollection = getImagesCollection();

    // Fetch the test image
    const image = await imagesCollection.findOne({ id: 'test-paris-001' });

    if (!image) {
      console.log('❌ Test image not found');
      process.exit(1);
    }

    console.log('✅ Found test image:', image.id);
    console.log('\n📍 Extracted Metadata:');
    console.log(JSON.stringify(image.extractedMetadata, null, 2));

    if (image.searchResults) {
      console.log('\n🔍 Tavily Search Results:');
      console.log('  Query:', image.searchResults.query);
      console.log('  Result Count:', image.searchResults.resultCount);
      console.log('  Searched At:', image.searchResults.searchedAt);
      console.log('\n  Results:');
      image.searchResults.results.forEach((result, i) => {
        console.log(`\n  ${i + 1}. ${result.title}`);
        console.log(`     Score: ${result.score}`);
        console.log(`     URL: ${result.url}`);
        console.log(`     Content: ${result.content.substring(0, 100)}...`);
      });
    } else {
      console.log('\n⚠️  No search results found in database');
    }

    if (image.aiOutput) {
      console.log('\n🤖 AI Output:');
      console.log(JSON.stringify(image.aiOutput, null, 2));
    }

    await closeDatabase();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyStorage();
