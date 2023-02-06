**This is a research demo. Support is not provided.

# Shopify Help Center Search via GPT
Quickly surface answers from Shopify's help center using GPT.

## Technologies used
- ScrapingBee to scrape list of help center urls
- Mongodb to store scraped data
- OpenAI to created embeddings vector points and completion prompt
- Pinecone to store vectors in db

## How this works
1. Run `tasks/1-sitemap-to-csv.js` to convert Shopify's Help Center Sitemap.xml into CSV and drop all columns except urls.
2. Convert CSV into array of links.
3. Run `tasks/2-scrape.js` to scrape the article text from every link using ScrapingBee and isnert text into Mongodb using url as unique index.
4. Run `tasks/3-generate-embeddings.js` to generate OpenAI embeddings and upsert into Pinecone.

## Why?
Created this as a research experiment in order to learn OpenAI embeddings + Pinecone. Added bonus was to have a way to quickly surface answers for my Shopify platform questions.

## How to optimize this further
- Split article text into smaller documents to decrease cost of token usage. Split by H2/section. 
- Test different models to see one cost. Curie is 10x cheaper than Davinci.
- Search documents with a normal search engine (Algolia) and pass that document into open AI rather than using embedding’s and Pinecone.
- Cache results for common queries.
- Test a shorter prompt to further save tokens.

