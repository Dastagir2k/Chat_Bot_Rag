const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function queryLLM(prompt) {
  try {
    const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({ prompt });

    return result.response.candidates[0].content; // Return the generated content
  } catch (error) {
    console.error("Error querying LLM:", error.message);
    throw error;
  }
}

module.exports = { queryLLM ,genAI};