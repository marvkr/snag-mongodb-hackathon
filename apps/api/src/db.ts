import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB client (will be initialized when connecting)
let client: MongoClient;

let db: Db;

// Database and collection names
const DB_NAME = 'hackathon';

export interface Bucket {
  _id?: ObjectId;
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  imageCount?: number;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResultsMetadata {
  query: string;
  results: TavilySearchResult[];
  searchedAt: Date;
  resultCount: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceMetadata {
  neighborhood?: string;
  city?: string;
  country?: string;
  placeType?: string;
}

export interface Place {
  _id?: ObjectId;
  id: string;
  name: string;
  address?: string;
  coordinates: Coordinates;
  category?: string;
  sourceScreenshotId: string;
  clusterId?: string;
  metadata?: PlaceMetadata;
  createdAt: Date;
}

export interface PlaceCluster {
  _id?: ObjectId;
  id: string;
  name: string;
  centroid: Coordinates;
  placeIds: string[];
  color: string;
  createdAt: Date;
}

export interface ImageMetadata {
  _id?: ObjectId;
  id: string;
  bucketId: string;
  url: string;
  imageBase64?: string;
  metadata: {
    filename: string;
    size: number;
    contentType: string;
    uploadedAt: Date;
  };
  intent?: {
    primary_bucket: string;
    bucket_candidates: Array<{
      bucket: string;
      confidence: number;
    }>;
    confidence: number;
    rationale: string;
  };
  extractedData?: {
    ocrText?: string;
    entities?: string[];
    places?: Array<{
      name: string;
      latitude?: number;
      longitude?: number;
    }>;
    products?: string[];
    metadata?: Record<string, any>;
  };
  embedding?: number[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processedAt?: Date;
  searchResults?: SearchResultsMetadata;
  aiOutput?: Record<string, any>;
  generatedAt?: Date;
}

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<Db> {
  try {
    // Get MongoDB URI from environment variable
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Initialize MongoDB client
    client = new MongoClient(uri);

    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    db = client.db(DB_NAME);

    // Create indexes
    await createIndexes();

    return db;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Create database indexes for optimal performance
 */
async function createIndexes() {
  try {
    // Index on bucket id for quick lookups
    await db.collection('buckets').createIndex({ id: 1 }, { unique: true });

    // Index on images for bucket queries and lookups
    await db.collection('images').createIndex({ bucketId: 1 });
    await db.collection('images').createIndex({ id: 1 });
    await db.collection('images').createIndex({ status: 1 });
    await db.collection('images').createIndex({ 'metadata.uploadedAt': -1 });
    await db.collection('images').createIndex({ 'intent.primary_bucket': 1 });

    // Index on places for quick lookups and filtering
    await db.collection('places').createIndex({ id: 1 }, { unique: true });
    await db.collection('places').createIndex({ sourceScreenshotId: 1 });
    await db.collection('places').createIndex({ clusterId: 1 });
    await db.collection('places').createIndex({ createdAt: -1 });

    // Index on clusters for quick lookups
    await db.collection('clusters').createIndex({ id: 1 }, { unique: true });
    await db.collection('clusters').createIndex({ createdAt: -1 });

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

/**
 * Get database instance
 */
export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Get buckets collection
 */
export function getBucketsCollection(): Collection<Bucket> {
  return getDb().collection<Bucket>('buckets');
}

/**
 * Get images collection
 */
export function getImagesCollection(): Collection<ImageMetadata> {
  return getDb().collection<ImageMetadata>('images');
}

/**
 * Get places collection
 */
export function getPlacesCollection(): Collection<Place> {
  return getDb().collection<Place>('places');
}

/**
 * Get clusters collection
 */
export function getClustersCollection(): Collection<PlaceCluster> {
  return getDb().collection<PlaceCluster>('clusters');
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  await client.close();
  console.log('✅ MongoDB connection closed');
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

export { ObjectId };
