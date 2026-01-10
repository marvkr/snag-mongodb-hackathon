import dotenv from 'dotenv';
import { connectToDatabase, getScreenshotsCollection, closeDatabaseConnection } from './src/db';

dotenv.config();

async function cleanupStuckScreenshots() {
  console.log('🧹 Cleaning up stuck screenshots...\n');

  try {
    await connectToDatabase();
    const screenshotsCollection = getScreenshotsCollection();

    // Find all screenshots stuck in processing status
    const stuckScreenshots = await screenshotsCollection
      .find({ status: 'processing' })
      .toArray();

    console.log(`Found ${stuckScreenshots.length} screenshots stuck in 'processing' status\n`);

    if (stuckScreenshots.length === 0) {
      console.log('✅ No cleanup needed!');
      return;
    }

    // Delete all stuck screenshots
    const result = await screenshotsCollection.deleteMany({
      status: 'processing',
    });

    console.log(`✅ Deleted ${result.deletedCount} stuck screenshots`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Found: ${stuckScreenshots.length}`);
    console.log(`   - Deleted: ${result.deletedCount}`);

    // Show remaining screenshots
    const remaining = await screenshotsCollection.countDocuments();
    console.log(`   - Remaining in DB: ${remaining}`);

  } catch (error) {
    console.error('❌ Error cleaning up screenshots:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
    process.exit(0);
  }
}

cleanupStuckScreenshots();
