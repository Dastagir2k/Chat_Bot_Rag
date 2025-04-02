// filepath: d:\Chat_Bot_GenAi\server\config\genaiConfig.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let generativeModel;

(async () => {
  try {
    // Initialize the generative model
    generativeModel = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Generative model initialized successfully.");
  } catch (err) {
    console.error("Error initializing generative model:", err.message);
  }
})();

module.exports = { genAI, generativeModel };