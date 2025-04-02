const express = require("express");
const multer = require("multer");
const { uploadPDF } = require("../controllers/uploadController");

const router = express.Router();
const upload = multer({ dest: "./public/images" });

router.post("/upload", upload.single("file"), uploadPDF);

module.exports = router;