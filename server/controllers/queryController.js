const { generativeModel } = require("../config/genaiConfig");
const { getClosestEmbeddings } = require("../utils/embeddings");

exports.handleQuery = async (req, res) => {
  try {
    const { query, user_id } = req.body;

    if (!query || !user_id) {
      return res.status(400).send("Query and user ID are required.");
    }

    const embeddings = await getClosestEmbeddings(query, user_id);

    if (embeddings.error) {
      return res.status(404).send(embeddings.error);
    }

    const context = embeddings
      .slice(0, 3)
      .map((doc, index) => `Document ${index + 1}: "${doc.sentence}"`)
      .join("\n");

    const prompt = `Given the following context:\n${context}\n\nAnswer the question: ${query}`;

    if (!generativeModel) {
      return res.status(500).send("Generative model is not initialized.");
    }

    const response = await generativeModel.generateText({ prompt });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error handling query:", error.message);
    res.status(500).send("Internal server error.");
  }
};