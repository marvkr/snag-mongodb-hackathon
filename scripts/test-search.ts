import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const voyageApiKey = process.env.VOYAGE_API_KEY;
const client = new MongoClient(uri);

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

  const data = await response.json();
  return data.data[0].embedding;
}

async function main() {
  await client.connect();
  console.log("Connected\n");

  const db = client.db("app");

  // Check what's in the collection
  const allUsers = await db.collection("users").find({}).toArray();
  console.log("Users in DB:");
  for (const u of allUsers) {
    console.log(`  - ${u.name}, hasEmbedding: ${!!u.imageEmbedding}, dims: ${u.imageEmbedding?.length ?? 0}`);
  }

  // Search for tropical beach
  console.log("\nSearching for 'tropical beach'...");
  const queryEmbedding = await getTextEmbedding("tropical beach");
  console.log(`Query embedding: ${queryEmbedding.length} dims`);

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
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();

  console.log("\nResults:");
  if (results.length === 0) {
    console.log("  No results found");
  }
  for (const r of results) {
    console.log(`  - ${r.name} (${r.email}), score: ${r.score?.toFixed(4)}`);
  }

  await client.close();
}

main();
