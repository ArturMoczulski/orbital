#!/usr/bin/env node

/**
 * download-face-api-models.js
 *
 * A simple script to download the face-api.js models required for face detection.
 * This script downloads the SSD MobileNet model, which is used for face detection
 * in the prepareFacialDataset.ts script.
 */

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the models directory
const modelsDir = path.join(path.resolve(__dirname, ".."), "models");

// Define the base URL for the model files
// Using the vladmandic repository which is actively maintained
const BASE_URL =
  "https://raw.githubusercontent.com/vladmandic/face-api/master/model";

// Define the models to download
const models = [
  {
    name: "ssd_mobilenetv1_model-weights_manifest.json",
    url: `${BASE_URL}/ssd_mobilenetv1_model-weights_manifest.json`,
  },
  // The model is now a single binary file instead of multiple shards
  {
    name: "ssd_mobilenetv1_model.bin",
    url: `${BASE_URL}/ssd_mobilenetv1_model.bin`,
  },
];

// Create the models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  console.log(`Creating models directory: ${modelsDir}`);
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${filePath}...`);

    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        // Handle redirects (302 Found, 301 Moved Permanently, etc.)
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          console.log(`Following redirect to ${redirectUrl}`);

          // Close the current file stream
          file.close();

          // Start a new download with the redirect URL
          downloadFile(redirectUrl, filePath).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`
            )
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`Downloaded ${url} to ${filePath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
  });
}

// Download all models
async function downloadModels() {
  console.log("Downloading face-api.js models...");

  try {
    for (const model of models) {
      const filePath = path.join(modelsDir, model.name);
      await downloadFile(model.url, filePath);
    }

    console.log("All models downloaded successfully!");
    console.log(`Models are located in: ${modelsDir}`);

    // List the downloaded models
    const files = fs.readdirSync(modelsDir);
    console.log("Downloaded models:");
    files.forEach((file) => {
      console.log(`- ${file}`);
    });
  } catch (error) {
    console.error("Error downloading models:", error);
    process.exit(1);
  }
}

// Run the download function
downloadModels();
