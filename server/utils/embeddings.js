const { genAI } = require("../config/genaiConfig");
const supabase = require("../models/supabaseClient");
const { calculateCosineSimilarity } = require("./cosineSimilarity");

async function generateEmbeddings(text) {
  try {
    const response = await genAI.models.embedContent({
      model: "gemini-embedding-exp-03-07",
      contents: [text],
    });
    return response.embeddings[0];
  } catch (error) {
    console.error("Error generating embeddings:", error.message);
    return null;
  }
}

async function storeEmbeddings(text, embedding, user_id) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .insert([{ user_id, text, embedding }]);

    if (error) {
      console.error("Error storing embeddings in Supabase:", error.message);
    } else {
      console.log("Embeddings stored successfully:", data);
    }
  } catch (error) {
    console.error("Error storing embeddings:", error);
  }
}

async function getClosestEmbeddings(query, user_id) {
  const queryEmbedding = await generateEmbeddings(query);
  if (!queryEmbedding) {
    return { error: "Failed to generate query embedding." };
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      console.error("Error fetching embeddings from Supabase:", error.message);
      return { error: "Error fetching embeddings." };
    }

    const similarities = data.map((item) => ({
      sentence: item.text,
      similarity: calculateCosineSimilarity(queryEmbedding, item.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities;
  } catch (error) {
    console.error("Error finding closest embeddings:", error.message);
    return { error: "Error finding closest embeddings." };
  }
}

async function main(extractedText, user_id) {
  try {
    const embedding = await generateEmbeddings(extractedText); // Generate embeddings
    if (embedding) {
      await storeEmbeddings(extractedText, embedding, user_id); // Store embeddings
    } else {
      console.error("Failed to generate embeddings.");
    }
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

module.exports = {
  main,
  generateEmbeddings,
  storeEmbeddings,
  getClosestEmbeddings,
};