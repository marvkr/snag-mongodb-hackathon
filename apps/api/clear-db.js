const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI not set in environment');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('hackathon');

    // Clear images, places, and clusters collections
    const imagesResult = await db.collection('images').deleteMany({});
    const placesResult = await db.collection('places').deleteMany({});
    const clustersResult = await db.collection('clusters').deleteMany({});

    console.log(`\n🗑️  Cleared database:`);
    console.log(`   - Images: ${imagesResult.deletedCount} deleted`);
    console.log(`   - Places: ${placesResult.deletedCount} deleted`);
    console.log(`   - Clusters: ${clustersResult.deletedCount} deleted`);
    console.log('\n✨ Database cleared successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clearDatabase();
