import { MongoClient, type Db } from "mongodb";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const client = new MongoClient(uri);

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().positive(),
  image: z.string().startsWith("data:image/").optional(),
});

async function imageToBase64(path: string): Promise<string> {
  const buffer = await readFile(path);
  const base64 = buffer.toString("base64");
  const ext = path.split(".").pop()?.toLowerCase();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

async function base64ToImage(dataUri: string, path: string): Promise<void> {
  const base64 = dataUri.split(",")[1];
  const buffer = Buffer.from(base64, "base64");
  await writeFile(path, buffer);
}

type User = z.infer<typeof UserSchema>;

async function seedUsers(db: Db) {
  const users = db.collection("users");

  // Clear existing data
  await users.deleteMany({});

  const data: User[] = [
    { name: "Alice", email: "alice@example.com", age: 28 },
    { name: "Bob", email: "bob@example.com", age: 34 },
    { name: "Charlie", email: "charlie@example.com", age: 22, image: await imageToBase64("./beach.jpg") },
  ];

  // Validate all users before inserting
  const validated = data.map((user) => UserSchema.parse(user));

  const result = await users.insertMany(validated);
  console.log(`Inserted ${result.insertedCount} users`);

  return users;
}

async function readUsers(db: Db): Promise<User[]> {
  const users = db.collection("users");
  const docs = await users.find().toArray();

  return docs.map((doc) => UserSchema.parse(doc));
}

async function main() {
  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db("app");
    await seedUsers(db);

    // Query them back using readUsers
    const allUsers = await readUsers(db);
    console.log("\nAll users:");
    for (const user of allUsers) {
      const hasImage = user.image ? " (has image)" : "";
      console.log(`  - ${user.name} (${user.email}), age ${user.age}${hasImage}`);

      const baseName = `./output-${user.name.toLowerCase()}`;

      if (user.image) {
        // Extract extension from data:image/jpeg;base64,... -> jpeg
        const ext = user.image.split(";")[0].split("/")[1];
        await base64ToImage(user.image, `${baseName}.${ext}`);
        console.log(`    -> image saved to ${baseName}.${ext}`);
      }

      // Save user data (without image) to text file
      const { image, ...userData } = user;
      await writeFile(`${baseName}.txt`, JSON.stringify(userData, null, 2));
      console.log(`    -> data saved to ${baseName}.txt`);
    }

  } finally {
    await client.close();
  }
}

main();
