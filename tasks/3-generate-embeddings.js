import "cross-fetch/dist/node-polyfill.js";
import { PineconeClient } from "pinecone-client";
import { Configuration, OpenAIApi } from "openai";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

if (
  !process.env.OPENAI_API_KEY ||
  !process.env.MONGODB_URI ||
  !process.env.MONGODB_DB ||
  !process.env.PINECONE_API_KEY ||
  !process.env.PINECONE_BASE_URL ||
  !process.env.PINECONE_NAMESPACE
) {
  throw new Error("Missing Environment Variables");
}

let totalUsage = 0;
let totalDocs = 0;

// Connect to Mongodb
const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
await client.connect();
const db = client.db(process.env.MONGODB_DB);

// Generate embeddings from OpenAI
const generateEmbeddingsFromOpenAI = async (content) => {
  // Create new OpenAI client
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Generate embeddings from OpenAI
  const openai = new OpenAIApi(configuration);
  const apiResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: content,
  });
  const responseData = apiResponse?.data;
  return responseData?.data[0].embedding;
};

// Upsert OpenAI generated vectors into Pinecone
const upsertVectorsIntoPinecone = async ({ id, embedding, locale = "en" }) => {
  // Create new Pinecone client
  const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY,
    baseUrl: process.env.PINECONE_BASE_URL,
    namespace: process.env.PINECONE_NAMESPACE,
  });

  // Upsert vectors into Pinecone
  pinecone.upsert({
    vectors: [
      {
        id,
        values: embedding,
        metadata: { locale },
      },
    ],
  });
};

const main = async () => {
  try {
    // Get all documents from Mongodb db collection docs
    const docs = await db.collection("docs").find({}).toArray();

    // Loop through all docs and generate embeddings
    for (const doc of docs) {
      // Generate embedding from OpenAI
      const embedding = await generateEmbeddingsFromOpenAI(doc.article);
      if (!embedding) {
        continue;
      }

      // Upsert embedding into pinecone
      await upsertVectorsIntoPinecone({ id: doc.url, embedding, locale: "en" });

      // Increase counts
      totalUsage += vectorResponse.usage.total_tokens;
      totalDocs++;
      console.log(
        `${totalDocs}/${docs.length} ${doc.url} inserted into Pinecone.`
      );
    }

    console.log("Total tokens used: ", totalUsage);
    console.log("Total cost: ", (totalUsage / 1000) * 0.0004);
  } catch (error) {
    // console.log(error);
    
  }
  process.exit() 
};

main();
