const { chromium } = require("playwright");
const fs = require("fs");
const { GoogleGenerativeAI } =require( '@google/generative-ai');
const genAI = new GoogleGenerativeAI("AIzaSyDTsORvAMzWWp4jBcNoi0r9i8-XS-SVy34");
let model;

(async () => {
    try {
        model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Model initialized");
    } catch (err) {
        console.error("Error initializing Generative Model:", err.message);
    }
})();

async function scrapeWebsite(baseUrl, model) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the main page
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Extract data from the main page
    const mainData = await scrapePageData(page);

    // Create a prompt for the LLM
    const prompt = createPrompt(mainData);

    // Query the LLM with the prompt
    const result = await model.generateContent(prompt)

    if (
      result.response &&
      result.response.candidates &&
      result.response.candidates.length > 0
    ) {
      // Get the generated text
      const generatedText = result.response.candidates[0].content;

      console.log("Generated Text:", generatedText);

      // Save the result to a CSV file
      saveToCSV(generatedText);
    } else {
      console.error("Unexpected response format or no candidates found.");
    }
  } catch (error) {
    console.error(`Error scraping URL ${baseUrl}:`, error.message);
  } finally {
    await browser.close();
  }
}

// Function to scrape data from the current page
async function scrapePageData(page) {
  const title = await page.title();
  const h1Tags = await page.$$eval("h1", (elements) =>
    elements.map((el) => el.textContent.trim())
  );
  const h2Tags = await page.$$eval("h2", (elements) =>
    elements.map((el) => el.textContent.trim())
  );
  const divTags = await page.$$eval("div", (elements) =>
    elements.map((el) => el.textContent.trim())
  );
  const pTags = await page.$$eval("p", (elements) =>
    elements.map((el) => el.textContent.trim())
  );

  return {
    title,
    h1Tags,
    h2Tags,
    divTags,
    pTags,
  };
}

// Function to create a prompt for the LLM
function createPrompt(data) {
  return `You are an AI assistant. Based on the following data scraped from a website, answer the following questions:
1. What is the company's mission statement or core values?
2. What products or services does the company offer?
3. When was the company founded, and who were the founders?
4. Where is the company's headquarters located?
5. Who are the key executives or leadership team members?
6. Has the company received any notable awards or recognitions?

Here is the data:
Title: ${data.title}
H1 Tags: ${data.h1Tags.join(" ")}
H2 Tags: ${data.h2Tags.join(" ")}
Div Tags: ${data.divTags.join(" ")}
P Tags: ${data.pTags.join(" ")}

Please provide a comprehensive analysis and generate the summary in JSON format.`;
}

// Function to save the generated text to a CSV file
function saveToCSV(generatedText) {
  try {
    const cleanedText = generatedText.replace("```json\n", "").replace("\n```", "");
    const jsonData = JSON.parse(cleanedText);

    const companyName = jsonData.company_name || "";
    const missionStatement = jsonData.mission_statement || "";
    const productsOrServices = jsonData.products_and_services
      ? jsonData.products_and_services.join(", ")
      : "";
    const founded = jsonData.founded ? jsonData.founded.year : "";
    const founders = jsonData.founded ? jsonData.founded.founders : "";
    const headquarters = `${jsonData.headquarters.city || ""}, ${
      jsonData.headquarters.country || ""
    }`;
    const keyExecutives = jsonData.key_executives
      ? JSON.stringify(jsonData.key_executives)
      : "";
    const awards = jsonData.awards_and_recognitions || "";

    const csvRow = `"${companyName}","${missionStatement}","${productsOrServices}","${founded}","${founders}","${headquarters}","${keyExecutives}","${awards}"\n`;

    fs.appendFileSync("results.csv", csvRow);
    console.log("CSV Row Saved:", csvRow);
  } catch (error) {
    console.error("Error parsing JSON or saving to CSV:", error.message);
  }
}

module.exports = { scrapeWebsite };