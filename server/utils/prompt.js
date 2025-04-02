function createPrompt(scrapedData) {
    let combinedData = "";
  
    scrapedData.forEach((page) => {
      combinedData += `URL: ${page.url}\n`;
      combinedData += `Title: ${page.title}\n`;
      combinedData += `H1 Tags: ${page.h1Tags.join(", ")}\n`;
      combinedData += `H2 Tags: ${page.h2Tags.join(", ")}\n`;
      combinedData += `Paragraphs: ${page.pTags.join(" ")}\n\n`;
    });
  
    return `You are an AI assistant. Based on the following data scraped from a website, answer the following questions:
  1. What is the company's mission statement or core values?
  2. What products or services does the company offer?
  3. When was the company founded, and who were the founders?
  4. Where is the company's headquarters located?
  5. Who are the key executives or leadership team members?
  6. Has the company received any notable awards or recognitions?
  
  Here is the data:
  ${combinedData}`;
  }
  
  module.exports = { createPrompt };