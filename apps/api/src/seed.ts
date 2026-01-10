import dotenv from 'dotenv';
import { connectToDatabase, getBucketsCollection, closeDatabase } from './db';

dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectToDatabase();

    const bucketsCollection = getBucketsCollection();

    // Clear existing buckets (optional - comment out if you want to keep existing data)
    await bucketsCollection.deleteMany({});
    console.log('🧹 Cleared existing buckets');

    // Seed buckets
    const buckets = [
      {
        id: 'travel',
        name: 'Travel',
        description: 'Extracts locations and provides travel recommendations',
        createdAt: new Date()
      },
      {
        id: 'products',
        name: 'Products',
        description: 'Analyzes products and finds similar items with reviews',
        createdAt: new Date()
      },
      {
        id: 'twitter',
        name: 'Twitter Screenshots',
        description: 'Crafts engaging replies to tweets',
        createdAt: new Date()
      },
    ];

    const result = await bucketsCollection.insertMany(buckets);
    console.log(`✅ Inserted ${result.insertedCount} buckets`);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seedDatabase();
