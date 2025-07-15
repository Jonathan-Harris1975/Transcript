
const express = require("express");
const dotenv = require("dotenv");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// S3-compatible config (for Cloudflare R2)
const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Health check route
app.get("/", (req, res) => {
  res.status(200).send("Transcript upload server is running with AWS SDK v3.");
});

// Upload transcript route
app.post("/upload-transcript", async (req, res) => {
  const { filename, content, bucket } = req.body;

  if (!filename || !content || !bucket) {
    return res.status(400).json({ error: "Missing required fields: filename, content, or bucket." });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: content,
      ContentType: "text/plain",
      ACL: "public-read",
    });

    await s3.send(command);

    res.status(200).json({ message: "Transcript uploaded successfully." });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload transcript." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
