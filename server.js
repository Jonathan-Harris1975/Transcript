const express = require("express");
const dotenv = require("dotenv");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

dotenv.config();
const app = express();
app.use(express.json());

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

app.get("/", (req, res) => {
  res.status(200).send("Transcript upload server is running with AWS SDK v3.");
});

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
      ContentType: "text/plain"
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
