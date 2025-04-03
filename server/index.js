const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { scrapeWebsite } = require("./utils/scrapper");
const { createPrompt } = require("./utils/prompt");
const { queryLLM } = require("./utils/llm");


const pdfParse = require("pdf-parse");
const e = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI( process.env.GEMINI_API_KEY);
let model;

(async () => {
    try {
        
        model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Model initialized:", model);
    } catch (err) {
        console.error("Error initializing Generative Model:", err.message);
    }
})();
// Supabase initialization
const supabaseUrl = "https://hqqljqflmtgbstsbpuoq.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Storage setup for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });



app.post("/scrape", async (req, res) => {
  const { websiteUrl } = req.body;

  if (!websiteUrl) {
    return res.status(400).send("Website URL is required.");
  }

  try {
    // Scrape the website
    const scrapedData = await scrapeWebsite(websiteUrl);

    // Create a prompt for the LLM
    const prompt = createPrompt(scrapedData);

    // Query the LLM with the prompt
    const response = await queryLLM(prompt);

    res.json({ response }); // Return the LLM's response
  } catch (error) {
    console.error("Error scraping website or querying LLM:", error.message);
    res.status(500).send("Internal server error.");
  }
});


// Endpoint to upload PDF
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    const filePath = req.file.path;
    const user_id = req.body.user_id; // Get user_id from the request body
    console.log("User ID:", user_id);

    // Read and parse the PDF
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return res.status(500).send("Error reading file");
      }

      pdfParse(data)
        .then(function (pdfData) {
          const extractedText = pdfData.text;

          if (extractedText.trim() === "") {
            return res.status(400).send("No text extracted from the PDF");
          }

          main(extractedText,user_id);
          res.send(extractedText);
        })
        .catch((error) => {
          console.error("Error parsing PDF:", error);
          return res.status(500).send("Error parsing PDF");
        });
    });
  } else {
    res.status(400).send("No file uploaded");
  }
});

// Endpoint for user signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send("Name, email, and password are required.");
    }

    // Check if the user already exists in the database
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user from Supabase:", fetchError);
      return res.status(500).send("Error checking user in the database.");
    }

    if (existingUser) {
      if (existingUser.password !== password) {
        console.log("Incorrect password for user:", email);
        return res.status(400).json({ check: "falseP", message: "Incorrect password." });
      }

      console.log("User already exists and logged in successfully:", email);
      return res.status(200).json({ check: "true", message: "User logged in successfully." ,data:existingUser });
    }

    // If the user does not exist, create a new user
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password }])
      .select(); // Use `.select()` to return the inserted data

    if (error) {
      console.error("Error storing user in Supabase:", error);
      return res.status(500).send("Error storing user.");
    }

    console.log("User signed up successfully:", data);
    return res.status(201).json({ check: "true", message: "User signed up successfully.", user: data[0] });
  } catch (error) {
    console.error("Error handling signup:", error);
    return res.status(500).send("Internal server error.");
  }
});

// Function to generate embeddings
async function main(extractedText, user_id) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.embedContent({
      model: "gemini-embedding-exp-03-07",
      contents: [extractedText],
    });

    const embedding = response.embeddings[0];
    await storeEmbedding(extractedText, embedding,user_id);
  } catch (error) {
    console.error("Error generating embeddings:", error);
  }
}

// Function to store embeddings in Supabase
async function storeEmbedding(sentence, embedding,user_id) {
  try {
    let embeddingArray = embedding.values;

    if (!Array.isArray(embeddingArray)) {
      throw new Error("Embedding 'values' is not in the expected format.");
    }

    if (embeddingArray.length > 384) {
      embeddingArray = embeddingArray.slice(0, 384);
    } else if (embeddingArray.length < 384) {
      const padding = new Array(384 - embeddingArray.length).fill(0);
      embeddingArray = embeddingArray.concat(padding);
    }

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          user_id:user_id,
          sentence: sentence,
          embedding: embeddingArray,
        },
      ]);

    if (error) {
      console.error("Error storing embedding in Supabase:", error);
    }
  } catch (error) {
    console.error("Error storing embedding:", error);
  }
}

// Endpoint to handle user query
app.post("/query", async (req, res) => {
  try {
    const { query, user_id } = req.body; // Get query and user_id from the request body
    console.log("Received query:", query, "for user_id:", user_id);

    if (!query || !user_id) {
      return res.status(400).send("Query and user ID are required.");
    }

    // Retrieve the closest matching document embeddings from Supabase
    const embeddings = await getClosestEmbeddings(query, user_id);

    if (embeddings.error) {
      return res.status(404).send(embeddings.error); // Send error message if no data is found
    }

    // Use the embeddings in a query to the LLM (Google Gemini in this case)
    const aiResponse = await queryLLMWithEmbeddings(embeddings, query);

    // Send the response from the LLM
    res.json(aiResponse);
  } catch (error) {
    console.error("Error handling query:", error);
    res.status(500).send("Internal server error");
  }
});

// Function to retrieve closest embeddings from Supabase based on the user's query
function calculateCosineSimilarity(queryEmbedding, documents) {
  console.log("Calculating cosine similarity...",documents);
  
  return documents.map((doc) => {
    if (Array.isArray(doc)) {
      console.log("hiii");
      
      // Calculate cosine similarity between query embedding and document embedding
      const similarity = cosineSimilarity(queryEmbedding, doc);
      return { embedding: doc, similarity };
    } else {
      return null;
    }
  }).filter((doc) => doc !== null).sort((a, b) => b.similarity - a.similarity);
}

async function getClosestEmbeddings(query, user_id) {
  try {
    // Fetch embeddings for the specific user
    const { data, error } = await supabase
      .from("documents")
      .select("sentence, embedding")
      .eq("user_id", user_id) // Filter by user_id
      .limit(5);
      console.log(user_id);
      

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return { error: "Error fetching data from the database." };
    }

    if (!data || data.length === 0) {
      console.log(`No documents found for user_id: ${user_id}`);
      return { error: "No data found " };
    }

    // Parse embeddings from strings to arrays of numbers
    const embeddings = data.map((doc) => {
      try {
        return JSON.parse(doc.embedding); // Parse the embedding string
      } catch (err) {
        console.error("Error parsing embedding:", err);
        return null;
      }
    }).filter((embedding) => Array.isArray(embedding)); // Filter out invalid embeddings

    console.log("Parsed embeddings from Supabase:", embeddings);

    // Get the embedding for the query
    const queryEmbedding = await getQueryEmbedding(query);
    // console.log("Query embedding:", queryEmbedding);

    // Pass the parsed embeddings array to calculateCosineSimilarity
    const closestDocuments = calculateCosineSimilarity(queryEmbedding.values, embeddings);
    // console.log("Closest documents:", closestDocuments);

    // Return the original sentence along with similarity for the top matches
    return closestDocuments.map(doc => ({
      sentence: data.find(d => d.embedding === JSON.stringify(doc.embedding)).sentence,
      similarity: doc.similarity,
    }));
  } catch (error) {
    console.error("Error getting closest embeddings:", error);
    return { error: "Error processing the request." };
  }
}


// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // or handle it in a way that makes sense for your application
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
// Function to get the embedding for the user's query using Gemini API
async function getQueryEmbedding(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-exp-03-07",
    contents: [query],
  });

  return response.embeddings[0];
}

// Function to query the LLM (Google Gemini or any other LLM)
// Function to query the LLM (Google Gemini or any other LLM)
async function queryLLMWithEmbeddings(embeddings, query) {
  const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("Querying LLM with embeddings...");

  // Check if embeddings are valid and create context
  if (!embeddings || embeddings.length === 0) {
    console.error("No valid embeddings found.");
    return { error: "No relevant context found." };
  }

  // Construct the context from the closest documents (using text and document source)
  const context = embeddings
    .slice(0, 3) // Use top 3 most similar embeddings
    .map((doc, index) => `Document ${index + 1}: "${doc.sentence}", Similarity: ${doc.similarity}`)
    .join("\n");

  // Log the context and query for debugging purposes
  console.log("Context for LLM:", context);
  console.log("Query for LLM:", query);

  if (!context) {
    return { error: "No relevant context found." };
  }

  // Construct the prompt for the LLM
  const prompt = `Given the following context:\n${context}\n\nAnswer the question: ${query}\n\nMake sure to mention at end  which document the answer is derived from. with the document name  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Response text from LLM:", text);
    return { text };
  } catch (error) {
    console.error("Error generating content from LLM:", error);
    return { error: "Error generating response." };
  }
}

// Start server
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
