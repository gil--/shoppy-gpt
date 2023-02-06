import { useCallback, useState } from "react";
import Head from "next/head";
import {
  AppProvider,
  Button,
  Card,
  Form,
  FormLayout,
  Link,
  Page,
  Stack,
  Text,
  TextField,
} from "@shopify/polaris";

import polarisTranslations from "@shopify/polaris/locales/en.json";
import { MagicMinor } from "@shopify/polaris-icons";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState();
  const [response, setResponse] = useState(null);
  const [article, setArticle] = useState(null);

  const handleGenerate = useCallback(async () => {
    try {
      setLoading(true);

      // Write a fetch request to the api using POST

      const data = await fetch(`/api/help`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const json = await data.json();

      setArticle(json?.article);
      setResponse(json?.query?.trim().replace(/^A: /, ""));
    } catch (e) {
      console.warn(e);

      // TODO: set error state
    }

    setLoading(false);
  }, [query]);

  const resetQuery = useCallback(() => {
    setResponse(null);
    setArticle(null);
    setQuery("");
    setLoading(false);
  }, []);

  return (
    <>
      <Head>
        <title>Shoppy by Gil Greenberg</title>
        <meta name="description" content="OpenAI powered Shopify search by Gil Greenberg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <AppProvider i18n={polarisTranslations}>
          <Page narrowWidth title="Shopify Help Center Bot">
            <Card title="Ask Shoppy AI a question about your Shopify store:">
              <Card.Section>
                <Form>
                  <FormLayout>
                    <TextField
                      labelHidden
                      label="Question"
                      value={query}
                      onChange={setQuery}
                      multiline={2}
                      maxLength={250}
                      showCharacterCount
                      autoFocus={true}
                      disabled={response}
                    />
                  </FormLayout>
                </Form>
              </Card.Section>
              <Card.Section title={response ? "Answer" : null}>
                {response ? (
                  <>
                    <Card.Subsection>
                      <Text variant="bodyLg">
                        {response === "Unknown."
                          ? "Your questions is unrelated to Shopify. Please ask a different question."
                          : response}
                      </Text>
                    </Card.Subsection>
                    {article && (
                      <Card.Subsection>
                        <Stack vertical spacing="extraTight">
                          <Text variant="headingSm">
                            Read full article to learn more
                          </Text>
                          <Link removeUnderline external url={article.url}>
                            <Text variant="headingMd">
                              {article.title} &rarr;
                            </Text>
                          </Link>
                          {/* TODO: description from meta */}
                        </Stack>
                      </Card.Subsection>
                    )}
                    <Card.Subsection>
                      <Button
                        fullWidth
                        primary
                        size="large"
                        onClick={resetQuery}
                        icon={MagicMinor}
                      >
                        Ask another question
                      </Button>
                    </Card.Subsection>
                  </>
                ) : (
                  <Button
                    fullWidth
                    primary
                    size="large"
                    disabled={!query}
                    loading={loading}
                    onClick={handleGenerate}
                    icon={MagicMinor}
                  >
                    Ask Shoppy
                  </Button>
                )}
              </Card.Section>
            </Card>
          </Page>
        </AppProvider>
      </main>
    </>
  );
}
