import scrapingbee from "scrapingbee";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

// Count of scraped urls
let count = 0;

if (!process.env.SCRAPING_BEE_API_KEY || !process.env.MONGODB_URI || !process.env.MONGODB_DB) {
  throw new Error("Missing Environment Variables");
}

// Create new scrapingbee client
const scrapingBee = new scrapingbee.ScrapingBeeClient(
  process.env.SCRAPING_BEE_API_KEY
);

// Demo sitemap urls
const sitemapUrls = [
  "https://help.shopify.com/en/manual/orders/self-serve-returns",
];

// Connect to Mongodb
const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
await client.connect();
const db = client.db(process.env.MONGODB_DB);

const scrapeUrl = async (url) => {
  const extract_rules = {
    // title: '//meta[@property="og:title"]',
    // description: '//meta[@name="description"]',
    title: "title",
    article: ".article",
  };
  const response = await scrapingBee.get({
    url,
    params: {
      render_js: "false", // Disable javascript rendering
      extract_rules: extract_rules,
    },
  });
  return response;
};

const scrapeUrlsAndSaveToMongo = async () => {
  // Loop through all sitemap urls
  for (const url of sitemapUrls) {
    const response = await scrapeUrl(url);
    const decoder = new TextDecoder();
    const responseJson = decoder.decode(response.data);

    const json = JSON.parse(responseJson);

    // Load the HTML into Mongodb as a new document on the collection docs
    await db.collection("docs").insertOne({
      url,
      title: json.title.replace("· Shopify Help Center", "").trim(),
      article: json.article,
      locale: "en",
    });
    count++;
    console.log(`${count}/${sitemapUrls.length} Scraped and inserted ${url} into Mongodb.`);
  }
  process.exit() 
};

scrapeUrlsAndSaveToMongo();
