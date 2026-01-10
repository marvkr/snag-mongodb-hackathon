import { MongoClient, type Db } from "mongodb";
import { readFile } from "node:fs/promises";
import { z } from "zod";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const voyageApiKey = process.env.VOYAGE_API_KEY;
const client = new MongoClient(uri);

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().positive(),
  image: z.string().startsWith("data:image/").optional(),
  imageEmbedding: z.array(z.number()).optional(),
});

type User = z.infer<typeof UserSchema>;

async function imageToBase64(path: string): Promise<string> {
  const buffer = await readFile(path);
  const base64 = buffer.toString("base64");
  const ext = path.split(".").pop()?.toLowerCase();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

async function getImageEmbedding(imageDataUrl: string): Promise<number[]> {
  const response = await fetch("https://api.voyageai.com/v1/multimodalembeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${voyageApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voyage-multimodal-3",
      inputs: [{ content: [{ type: "image_base64", image_base64: imageDataUrl }] }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function getTextEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.voyageai.com/v1/multimodalembeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${voyageApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voyage-multimodal-3",
      inputs: [{ content: [{ type: "text", text }] }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function ensureVectorIndex(db: Db) {
  const collection = db.collection("users");
  const indexName = "image_vector_index";

  const indexes = await collection.listSearchIndexes().toArray();
  const exists = indexes.some((idx) => idx.name === indexName);

  if (exists) {
    console.log(`Vector index "${indexName}" already exists`);
    return;
  }

  console.log(`Creating vector index "${indexName}"...`);
  await collection.createSearchIndex({
    name: indexName,
    type: "vectorSearch",
    definition: {
      fields: [{
        path: "imageEmbedding",
        type: "vector",
        numDimensions: 1024,
        similarity: "cosine",
      }],
    },
  });

  // Wait for index to be ready
  console.log("Waiting for index to build...");
  let ready = false;
  while (!ready) {
    await new Promise((r) => setTimeout(r, 1000));
    const updated = await collection.listSearchIndexes().toArray();
    const idx = updated.find((i) => i.name === indexName);
    ready = idx?.status === "READY";
  }
  console.log("Index ready!");
}

async function seedUsers(db: Db) {
  const users = db.collection("users");
  await users.deleteMany({});

  const image = await imageToBase64("./beach.jpg");

  console.log("Generating embedding for image...");
  const imageEmbedding = await getImageEmbedding(image);
  console.log(`Embedding: ${imageEmbedding.length} dimensions`);

  const data: User[] = [
    { name: "Alice", email: "alice@example.com", age: 28 },
    { name: "Bob", email: "bob@example.com", age: 34 },
    { name: "Charlie", email: "charlie@example.com", age: 22, image, imageEmbedding },
  ];

  const result = await users.insertMany(data);
  console.log(`Inserted ${result.insertedCount} users`);
}

async function findUsersByImageQuery(db: Db, query: string): Promise<User[]> {
  console.log(`\nSearching for "${query}"...`);
  const queryEmbedding = await getTextEmbedding(query);

  const results = await db.collection("users").aggregate([
    {
      $vectorSearch: {
        index: "image_vector_index",
        path: "imageEmbedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 10,
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        age: 1,
        hasImage: { $cond: [{ $ifNull: ["$image", false] }, true, false] },
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();

  return results as User[];
}

async function main() {
  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db("app");

    await ensureVectorIndex(db);
    await seedUsers(db);

    const results = await findUsersByImageQuery(db, "tropical beach");
    console.log("\nResults:");
    for (const user of results) {
      const score = (user as any).score?.toFixed(4);
      console.log(`  - ${user.name}, age ${user.age}, hasImage: ${(user as any).hasImage} [score: ${score}]`);
    }

  } finally {
    await client.close();
  }
}

main();
