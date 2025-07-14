const express = require("express");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
  region: "auto",
  signatureVersion: "v4"
});

app.post("/upload-transcript", async (req, res) => {
  const { filename, content, bucket = "podcast-transcripts" } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ error: "Missing filename or content" });
  }

  try {
    await s3
      .putObject({
        Bucket: bucket,
        Key: filename,
        Body: content,
        ContentType: "text/plain"
      })
      .promise();

    const publicUrl = `${process.env.R2_ENDPOINT}/${bucket}/${filename}`;
    res.json({ uploaded: true, url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Failed to upload to R2" });
  }
});

// Health check
app.get("/", (_, res) => res.send("Transcript uploader live 🎤"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Transcript server running on ${PORT}`));
