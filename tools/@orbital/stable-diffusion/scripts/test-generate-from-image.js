#!/usr/bin/env node

/**
 * Test script for the generateFromImage function
 * This script tests the generateFromImage function with the face2face workflow
 *
 * Usage:
 * node scripts/test-generate-from-image.js <input-image-path>
 */

import path from "path";
import { fileURLToPath } from "url";
import { generateFromImage } from "../dist/orchestrators/generateFromImage.js";
import { createFace2faceWorkflow } from "../dist/workflows/face2face.js";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const inputImagePath = process.argv[2];

if (!inputImagePath) {
  console.error("Please provide an input image path");
  console.error(
    "Usage: node scripts/test-generate-from-image.js <input-image-path>"
  );
  process.exit(1);
}

// Set up options for the face2face workflow
const options = {
  input: inputImagePath,
  output: path.join(__dirname, "../output/test-generate-from-image"),
  prompt: "a person with a neutral expression",
  steps: 20,
  seed: 42,
  denoise: 0.4,
  preview: true, // Use preview mode for faster testing
};

console.log("Testing generateFromImage with face2face workflow");
console.log("Input image:", inputImagePath);
console.log("Output directory:", options.output);

// Mock models for testing
const models = {
  checkpoints: ["realisticVisionV60B1.safetensors"],
  vaes: ["vae-ft-mse-840000-ema-pruned.safetensors"],
};

// Run the test
async function runTest() {
  try {
    console.log("Starting generateFromImage...");

    const result = await generateFromImage(
      options.input,
      options,
      createFace2faceWorkflow,
      "", // Use default outputNodeId
      "face2face" // Workflow name
    );

    if (result) {
      console.log("Success! Generated image saved at:", result);
    } else {
      console.error("Failed to generate image");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

runTest();
