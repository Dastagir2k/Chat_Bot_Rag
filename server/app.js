const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const queryRoutes = require("./routes/queryRoutes");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/files", uploadRoutes);
app.use("/queries", queryRoutes);

module.exports = app;