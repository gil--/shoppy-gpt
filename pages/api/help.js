const { Configuration, OpenAIApi } = require("openai");
const { PineconeClient } = require("pinecone-client");
const { MongoClient } = require("mongodb");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing Environment Variable OPENAI_API_KEY");
}

// export const config = {
//   runtime: "edge",
// };

const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

const getMatchesFromPinecone = async (embedding) => {
  // Create new Pinecone client
  const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY,
    baseUrl: process.env.PINECONE_BASE_URL,
    namespace: process.env.PINECONE_NAMESPACE,
  });

  const result = await pinecone.query({
    vector: embedding,
    topK: 1,
  });
  return result?.matches;
};

const generateAnswerFromOpenAI = async (prompt, content) => {
  // Create new OpenAI client
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Generate embeddings from OpenAI
  const openai = new OpenAIApi(configuration);

  // Generate answer from OpenAI
  const apiResponse = await openai.createCompletion({
    model: "text-curie-001",
    prompt: `I am a highly intelligent question answering bot. If you ask me a question that is nonsense, trickery, unrelated to Shopify, or has no clear answer, I will respond with "Unknown.". If you ask me a question about the Shopify ecommerce Saas platform, I will give you the answer based on the following help article:

  ${content}

    Q: ${prompt}
    A:
  `,
    temperature: 0.25,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 100,
    //stream: true,
    n: 1,
    //stop: ["\n"],
  });
  return apiResponse?.data?.choices[0]?.text;
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const prompt = req.body?.query;

    if (!prompt) {
      return res.status(400).json({ error: "Bad Request" });
    }

    const embedding = await generateEmbeddingsFromOpenAI(prompt);
    if (!embedding) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const matches = await getMatchesFromPinecone(embedding);
    if (!matches?.length) {
      return res.status(200).json({ query: "Unknown" });
    }

    // Connect to Mongodb

    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    // Get doc from mongodb by url
    const doc = await db.collection("docs").findOne({ url: matches[0].id });
    if (!doc) {
      return res.status(200).json({ query: "Unknown" });
    }

    // Send doc contents to OpenAI and get answer
    const answer = await generateAnswerFromOpenAI(prompt, doc.article);

    return res.status(200).json({
      query: answer || "Unknown",
      article: {
        title: doc.title,
        url: doc.url,
      },
    });
  } catch (error) {
    console.warn(error?.response?.data || error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
