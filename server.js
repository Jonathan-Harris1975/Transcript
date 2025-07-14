const express = require("express");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// S3-compatible config (for Cloudflare R2)
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
  signatureVersion: "v4",
  region: "auto", // R2 requires "auto"
});

// Health check route
app.get("/", (req, res) => {
  res.status(200).send("Transcript upload server is running.");
});

// Upload transcript route
app.post("/upload-transcript", async (req, res) => {
  const { filename, content, bucket } = req.body;

  if (!filename || !content || !bucket) {
    return res.status(400).json({ error: "Missing required fields: filename, content, or bucket." });
  }

  const params = {
    Bucket: bucket,
    Key: filename,
    Body: content,
    ContentType: "text/plain",
    ACL: "public-read",
  };

  try {
    await s3.putObject(params).promise();
    const publicUrl = `${process.env.R2_ENDPOINT}/${bucket}/${filename}`;
    res.status(200).json({ message: "Upload successful", url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
