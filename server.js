const express = require("express");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudflare R2 setup
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
  region: "auto",
});

// Serve transcript by key
app.get("/transcript/:filename", async (req, res) => {
  const params = {
    Bucket: process.env.R2_BUCKET,
    Key: req.params.filename,
  };

  try {
    const data = await s3.getObject(params).promise();
    res.set("Content-Type", "text/plain");
    res.send(data.Body.toString());
  } catch (err) {
    console.error("R2 fetch error:", err.message);
    res.status(404).send("Transcript not found.");
  }
});

app.listen(PORT, () => {
  console.log(`Transcript server running on port ${PORT}`);
});
