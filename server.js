import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { S3 } from "aws-sdk";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

const s3 = new S3({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
  signatureVersion: "v4"
});

app.post("/upload-transcript", async (req, res) => {
  const { filename, text, bucket = "podcast" } = req.body;

  if (!filename || !text) {
    return res.status(400).json({ error: "Missing 'filename' or 'text'" });
  }

  try {
    const params = {
      Bucket: bucket,
      Key: filename,
      Body: text,
      ContentType: "text/plain"
    };

    await s3.putObject(params).promise();
    const fileUrl = `${process.env.R2_ENDPOINT}/${bucket}/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Upload to R2 failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Transcript upload API running on port ${PORT}`));
