const fs = require("fs");
const pdfParse = require("pdf-parse");

async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error("Error parsing PDF:", error.message);
    return null;
  }
}

module.exports = { parsePDF };