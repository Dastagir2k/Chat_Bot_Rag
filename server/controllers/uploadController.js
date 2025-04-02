const fs = require("fs");
const pdfParse = require("pdf-parse");
const { main } = require("../utils/embeddings");

exports.uploadPDF = (req, res) => {
  if (req.file) {
    const filePath = req.file.path;
    const user_id = req.body.user_id;

    fs.readFile(filePath, (err, data) => {
      if (err) {
        return res.status(500).send("Error reading file");
      }

      pdfParse(data)
        .then((pdfData) => {
          const extractedText = pdfData.text;

          if (extractedText.trim() === "") {
            return res.status(400).send("No text extracted from the PDF");
          }

          main(extractedText, user_id);
          res.send(extractedText);
        })
        .catch((error) => {
          return res.status(500).send("Error parsing PDF");
        });
    });
  } else {
    res.status(400).send("No file uploaded");
  }
};